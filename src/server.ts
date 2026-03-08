import http from "http";
import { App } from "./app";
import { port } from "./config";
import { DatabaseConnection } from "./infrastructure/database/db.connection";
import { kafkaProducer } from "./infrastructure/kafka/producer";
import { redisConnection } from "./infrastructure/redis/redis.connection";

async function bootstrap() {
    try {
        // 1️⃣ Database
        const db = DatabaseConnection.getInstance();
        await db.connect();

        // 2️⃣ Kafka Producer (Needed for sending events)
        await kafkaProducer.connect();

        // 3️⃣ Redis (Needed for tokens/OTPs)
        // Handled via singleton, but can explicit wait or check if needed
        // await redisConnection.connect(); // If we add explicit connect

        // 4️⃣ Start API Server
        const appInstance = new App();
        const app = appInstance.getServer();
        const server = http.createServer(app);

        server.listen(port, () => {
            console.log(`🚀 API Server running on port ${port}`);
        });

        const shutdown = async (signal: string) => {
            console.log(`⚠️ ${signal} received. Shutting down API...`);
            await kafkaProducer.disconnect();
            await redisConnection.disconnect();

            server.close(() => {
                console.log("🛑 API Server closed");
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

    } catch (error) {
        console.error("❌ Failed to start API server", error);
        process.exit(1);
    }
}

bootstrap();
