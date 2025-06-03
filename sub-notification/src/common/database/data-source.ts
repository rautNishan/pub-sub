import { DataSource } from "typeorm";
import { config } from "../configs";

export const dataSource: DataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: Number(config.database.port) || 5432,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  logging: config.database.logger === "true",
  entities: ["./src/**/*.entity{.ts,.js}"],
  migrations: ["./src/common/database/migrations/*{.ts,.js}"],
});
