import { BrokerInterface } from "../interfaces/consumer.interface";
import { RabbitMQConsumer } from "../rabbitmq.consumer";
// import { RedisConsumer } from '../RedisConsumer'; // Future

interface ConsumerFactoryOptions {
  type: "rabbitmq" | "redis";
}

export class ConsumerFactory {
  static create(options: ConsumerFactoryOptions): BrokerInterface {
    switch (options.type) {
      case "rabbitmq":
        return new RabbitMQConsumer();
      // case 'redis':
      //   return new RedisConsumer(options.config, options.logger);
      default:
        throw new Error(`Unknown consumer type: ${options.type}`);
    }
  }
}
