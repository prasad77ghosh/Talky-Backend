import "dotenv/config";
import { kafkaConsumer } from "./infrastructure/kafka/consumer";
import { AuthConsumer } from "./modules/athentication/auth.consumer";
import { DatabaseConnection } from "./infrastructure/database/db.connection";

async function startWorker() {
    try {
        console.log("🛠️ Starting Background Worker...");

        // 1️⃣ Database (If consumers need to update DB)
        const db = DatabaseConnection.getInstance();
        await db.connect();

        // 2️⃣ Kafka Consumer
        await kafkaConsumer.connect();
        
        // 3️⃣ Initialize Module Consumers
        await AuthConsumer.start();

        console.log("🚀 Background Worker is running...");

        const shutdown = async (signal: string) => {
            console.log(`⚠️ ${signal} received. Shutting down worker gracefully...`);
            await kafkaConsumer.disconnect();
            process.exit(0);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

    } catch (error) {
        console.error("❌ Failed to start background worker", error);
        process.exit(1);
    }
}

startWorker();
