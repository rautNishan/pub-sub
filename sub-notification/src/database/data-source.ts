import { DataSource } from "typeorm";
import { config } from "../common/configs";
import path from "path";

export const dataSource: DataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: Number(config.database.port) || 5432,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  logging: config.database.logger === "true",
  entities: [path.join(__dirname, "../**/*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "./migrations/**/*.{ts,js}")],
});
