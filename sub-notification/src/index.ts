import fastify from "fastify";
import { startConsumer } from "./common/consumers/consumer";
import { NotificationController } from "./modules/notifications/controller/notification.controller";
import { DBConnection } from "./database/connections/database.connection";

const server = fastify();

async function registerRoutes() {
  try {
    console.log("Register router");

    const notificationController = new NotificationController();
    console.log("Notification Controller");

    server.get("/ping", async () => "pong\n");

    server.get("/notifications", async (request, reply) => {
      const { page, limit } = request.query as {
        page?: string;
        limit?: string;
      };
      const data = await notificationController.getAll({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      return { data };
    });

    server.get("/notifications/summary", async () => {
      const summary = await notificationController.getSummary();
      return { summary };
    });

    console.log("Routes registered");
  } catch (err) {
    console.error("Error registering routes:", err);
    throw err;
  }
}

async function start() {
  try {
    console.log("First");
    await DBConnection.connection();
    console.log("Second");
    await registerRoutes();
    console.log("Third");
    await startConsumer();
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("✅ Server listening on port 3000");
    server.log.info("Server listening on port 3000");
  } catch (err) {
    console.error("Failed to start server:", err); // Add console.error too
    server.log.error("Failed to start server:", err);
  }
}

start();
