import { ConsumerFactory } from "./factory/consumer.factory";

export async function startConsumer() {
  const consumer = ConsumerFactory.create({
    type: "rabbitmq",
  });

  await consumer.consume();
}
