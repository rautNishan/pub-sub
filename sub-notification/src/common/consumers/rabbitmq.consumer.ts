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

    await this.channel.assertExchange(this.config.exchange, "topic", {
      durable: true,
    });

    for (const [queueType, queueConfig] of Object.entries(this.config.queues)) {
      await this.channel.assertQueue(queueConfig.name, {
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
    }

    // Setup dead letter exchange for failed messages
    await this.channel.assertExchange(`${this.config.exchange}_dlx`, "direct", {
      durable: true,
    });
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

      if (handler) {
        await handler.handle(notificationData);
      }

      // Acknowledge the message after successful processing
      this.channel.ack(message);
    } catch (error) {
      console.error("Error processing message:", error);

      // Reject the message and send to dead letter queue
      //   if (this.channel && message) {
      //     this.channel.nack(message, false, false);
      //   }
    }
  }

  private async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}
