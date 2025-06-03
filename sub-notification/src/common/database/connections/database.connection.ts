import { DataSource } from "typeorm";
import { config } from "../../configs";
import { DatabaseException } from "../../exceptions/database.exceptions";
import path from "path";

export class DBConnection {
  private static dataSource: DataSource;

  public static async connection() {
    console.log("Trying to connect....");
    if (!DBConnection.dataSource) {
      DBConnection.dataSource = new DataSource({
        type: "postgres",
        host: config.database.host,
        port: Number(config.database.port) || 5432,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
        logging: config.database.logger === "true",
        entities: [path.join(__dirname, "../../../modules/**/*.entity.js")],
        migrations: [path.join(__dirname, "../../migrations/*.js")],
      });
    }
    try {
      await this.dataSource.initialize();
      console.log("Database Connected Successfully.....");
    } catch (error: any) {
      console.log("Failed to connect to database: ", error);
      throw error;
    }
  }

  public static getConnection(): DataSource {
    if (!DBConnection.dataSource) {
      throw new DatabaseException("Database is not even connected");
    }
    return DBConnection.dataSource;
  }

  public static async closeConnection() {
    if (DBConnection.dataSource && DBConnection.dataSource.isInitialized) {
      try {
        await DBConnection.dataSource.destroy();
        console.log("Database Connection Closed Successfully");
      } catch (error) {
        console.log("Something went wrong: ", error);
        throw error;
      }
    }
  }
}
