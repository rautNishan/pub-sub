import amqp, { Channel, Connection, Message } from "amqplib";
import { ConsumerInterface } from "./interfaces/consumer.interface";
import { NotificationMessage } from "./interfaces/notification.message.interface";
import { NotificationHandler } from "./interfaces/handler.interface";
import { EmailNotificationHandler } from "./handlers/email.handler";
import { SmsNotificationHandler } from "./handlers/sms.handler";
import { config } from "../configs";

interface RabbitMQConfig {
  url: string;
  exchange: string;
  queues: {
    [key: string]: {
      name: string;
      routingKeys: string[];
    };
  };
}

export class RabbitMQConsumer implements ConsumerInterface {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQConfig;
  private handlers: Map<string, NotificationHandler>;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY = 10000;

  constructor() {
    this.config = {
      url: config.pubSub.rabbitMq.url,
      exchange: config.pubSub.rabbitMq.exchange,
      queues: {
        email: {
          name: "email_notifications",
          routingKeys: ["notification.email"],
        },
        sms: {
          name: "sms_notifications",
          routingKeys: ["notification.sms"],
        },
        //For future
        // push: {
        //   name: "push_notifications",
        //   routingKeys: ["notification.push"],
        // },
      },
    };

    // Initialize handlers
    this.handlers = new Map([
      ["email", new EmailNotificationHandler()],
      ["sms", new SmsNotificationHandler()],
    ]);
  }

  async consume(): Promise<void> {
    try {
      await this.connect();
      await this.setupExchangeAndQueues();
      await this.startConsuming();

      console.log("RabbitMQ Consumer started successfully");
    } catch (error) {
      console.error("Failed to start RabbitMQ consumer:", error);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();
      console.log("Connected to RabbitMQ");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  private async setupExchangeAndQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    // Setup main exchange
    await this.channel.assertExchange(this.config.exchange, "topic", {
      durable: true,
    });

    // Setup retry exchange
    await this.channel.assertExchange(
      `${this.config.exchange}_retry`,
      "direct",
      {
        durable: true,
      }
    );

    // Setup dead letter exchange for failed messages
    await this.channel.assertExchange(`${this.config.exchange}_dlx`, "direct", {
      durable: true,
    });

    for (const [queueType, queueConfig] of Object.entries(this.config.queues)) {
      await this.channel.assertQueue(queueConfig.name, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": `${this.config.exchange}_retry`,
          "x-dead-letter-routing-key": `${queueConfig.name}_retry`,
        },
      });

      const retryQueueName = `${queueConfig.name}_retry`;
      await this.channel.assertQueue(retryQueueName, {
        durable: true,
        arguments: {
          "x-message-ttl": this.RETRY_DELAY,
          "x-dead-letter-exchange": this.config.exchange,
          "x-dead-letter-routing-key": queueConfig.routingKeys[0],
        },
      });

      const dlqName = `${queueConfig.name}_dlq`;
      await this.channel.assertQueue(dlqName, {
        durable: true,
      });

      for (const routingKey of queueConfig.routingKeys) {
        await this.channel.bindQueue(
          queueConfig.name,
          this.config.exchange,
          routingKey
        );

        console.log(
          `Bound queue ${queueConfig.name} to exchange ${this.config.exchange} with routing key: ${routingKey}`
        );
      }

      await this.channel.bindQueue(
        retryQueueName,
        `${this.config.exchange}_retry`,
        `${queueConfig.routingKeys[0]}_retry`
      );

      await this.channel.bindQueue(
        dlqName,
        `${this.config.exchange}_dlx`,
        `${queueConfig.name}_dlq`
      );

      console.log(`Setup retry mechanism for queue: ${queueConfig.name}`);
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    for (const [queueType, queueConfig] of Object.entries(this.config.queues)) {
      await this.channel.consume(
        queueConfig.name,
        (message: string) => this.handleMessage(message, queueType),
        {
          noAck: false,
        }
      );

      console.log(`Started consuming from queue: ${queueConfig.name}`);
    }
  }

  private async handleMessage(
    message: Message | null,
    queueType: string
  ): Promise<void> {
    if (!message || !this.channel) {
      return;
    }

    try {
      const content = message.content.toString();
      const notificationData: NotificationMessage = JSON.parse(content);

      console.log(`Received message from ${queueType} queue:`, {
        id: notificationData.id,
        type: notificationData.type,
        routing_key: message.fields.routingKey,
      });

      const handler = this.handlers.get(notificationData.type);
      const retryCount = this.getRetryCount(message);
      if (handler) {
        await handler.handle(notificationData, retryCount);
      }

      // Acknowledge the message after successful processing
      this.channel.ack(message);
    } catch (error) {
      console.error("Error processing message:", error);
      await this.handleFailedMessage(message, queueType, error);
    }
  }
  private async handleFailedMessage(
    message: Message,
    queueType: string,
    error: any
  ): Promise<void> {
    if (!this.channel) {
      return;
    }

    const retryCount = this.getRetryCount(message);
    console.log("This is retry count while retrying: ", retryCount);

    if (retryCount < this.MAX_RETRY_COUNT) {
      // Retry the message
      console.log(
        `Retrying message (attempt ${retryCount + 1}/${this.MAX_RETRY_COUNT}):`,
        {
          routing_key: message.fields.routingKey,
          error: error.message,
        }
      );

      // Increment retry count and reject to retry queue
      await this.rejectMessageForRetry(message, retryCount + 1);
    } else {
      // Max retries exceeded, send to dead letter queue
      console.error(`Max retries exceeded for message, sending to DLQ:`, {
        routing_key: message.fields.routingKey,
        retry_count: retryCount,
        error: error.message,
      });

      await this.sendToDeadLetterQueue(message, queueType, error);
    }
  }

  private getRetryCount(message: Message): number {
    const headers = message.properties.headers || {};
    return headers["x-retry-count"] || 0;
  }

  private async rejectMessageForRetry(
    message: Message,
    newRetryCount: number
  ): Promise<void> {
    if (!this.channel) return;

    const payload = message.content;

    const headers = {
      ...(message.properties.headers || {}),
      "x-retry-count": newRetryCount,
    };

    const routingKey = message.fields.routingKey;
    console.log("This is routing key: ", routingKey);

    this.channel.publish(
      `${this.config.exchange}_retry`,
      `${message.fields.routingKey}_retry`,
      payload,
      {
        headers,
        contentType: message.properties.contentType,
        contentEncoding: message.properties.contentEncoding,
        persistent: true,
      }
    );

    this.channel.ack(message);
  }

  private async sendToDeadLetterQueue(
    message: Message,
    queueType: string,
    error: any
  ): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      const queueConfig = Object.values(this.config.queues).find(
        (q) =>
          message.fields.routingKey &&
          q.routingKeys.includes(message.fields.routingKey)
      );
      console.log("This is queue config: ", queueConfig);

      if (queueConfig) {
        const dlqRoutingKey = `${queueConfig.name}_dlq`;

        // Add failure information to headers
        const headers = { ...message.properties.headers };

        headers["x-death-reason"] = error.message;
        headers["x-death-time"] = new Date().toISOString();
        headers["x-original-routing-key"] = message.fields.routingKey;
        await this.channel.publish(
          `${this.config.exchange}_dlx`,
          dlqRoutingKey,
          message.content,
          {
            ...message.properties,
            headers,
          }
        );

        console.log(`Message sent to dead letter queue: ${dlqRoutingKey}`);
      }
      this.channel.ack(message);
    } catch (dlqError) {
      console.error("Error sending message to DLQ:", dlqError);
      this.channel.nack(message, false, false);
    }
  }

  // private async close(): Promise<void> {
  //   try {
  //     if (this.channel) {
  //       await this.channel.close();
  //     }
  //     if (this.connection) {
  //       await this.connection.close();
  //     }
  //     console.log("RabbitMQ connection closed");
  //   } catch (error) {
  //     console.error("Error closing RabbitMQ connection:", error);
  //   }
  // }
}
