import http from "http";
import { App } from "./app";
import { port } from "./config";
import { DatabaseConnection } from "./infrastructure/database/db.connection";
import { kafkaProducer } from "./infrastructure/kafka/producer";
import { redisConnection } from "./infrastructure/redis/redis.connection";
import { kafkaConsumer } from "./infrastructure/kafka/consumer";
import { AuthConsumer } from "./modules/athentication/auth.consumer";

async function bootstrap() {
    try {
        // 1️⃣ Database
        const db = DatabaseConnection.getInstance();
        await db.connect();

        // 2️⃣ Kafka Producer
        await kafkaProducer.connect();

        // 3️⃣ Redis
        // Already imported at top

        // 4️⃣ Kafka Consumer
        await kafkaConsumer.connect();
        await AuthConsumer.start();

        // 5️⃣ Start Server
        const appInstance = new App();
        const app = appInstance.getServer();
        const server = http.createServer(app);

        server.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });

        const shutdown = async (signal: string) => {
            console.log(`⚠️ ${signal} received. Shutting down gracefully...`);
            await kafkaProducer.disconnect();
            await kafkaConsumer.disconnect();
            await redisConnection.disconnect();

            server.close(() => {
                console.log("🛑 Server closed");
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

    } catch (error) {
        console.error("❌ Failed to start server", error);
        process.exit(1);
    }
}

bootstrap();
