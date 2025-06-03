import "dotenv/config";

export const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER_NAME,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME,
  logger: process.env.DB_LOGGER,
};
