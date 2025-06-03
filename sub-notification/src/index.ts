import fastify from "fastify";
import { config } from "./common/configs";
import { startConsumer } from "./common/consumers/consumer";
import { DBConnection } from "./common/database/connections/database.connection";

const server = fastify();

server.get("/ping", async (request, reply) => {
  console.log(config.database.host);
  return "pong\n";
});

async function start() {
  try {
    // Start Fastify server
    await server.listen({ port: 8080, host: "0.0.0.0" });
    server.log.info("Server listening on port 8080");
    await DBConnection.connection();
    // Start consumer after server is ready
    await startConsumer();
  } catch (err) {
    server.log.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
