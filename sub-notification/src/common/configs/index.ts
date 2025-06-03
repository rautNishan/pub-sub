import "reflect-metadata";
import { dbConfig } from "./database.config";
import { consumerConfig } from "./consumer.config";

export const config = {
  database: dbConfig,
  pubSub: consumerConfig,
};
