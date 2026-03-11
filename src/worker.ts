import "dotenv/config";
import { AuthConsumer } from "./modules/athentication/auth.consumer";
import { DatabaseConnection } from "./infrastructure/database/db.connection";
import { kafkaProducer } from "./infrastructure/kafka/producer";

async function startWorker() {
    try {
        console.log("🛠️ Starting Background Worker...");

        // 1️⃣ Database (If consumers need to update DB)
        const db = DatabaseConnection.getInstance();
        await db.connect();

        // 2️⃣ Kafka Producer (Required for DLQ)
        await kafkaProducer.connect();

        // 3️⃣ Initialize Module Consumers
        await AuthConsumer.start();

        // 4️⃣ Optional: Start DLQ Recovery (In production, usually a separate worker instance)
        if (process.env.ENABLE_DLQ_CONSUMER === "true") {
            await AuthConsumer.startDLQ();
        }

        console.log("🚀 Background Worker is running...");

        const shutdown = async (signal: string) => {
            console.log(`⚠️ ${signal} received. Shutting down worker gracefully...`);
            await AuthConsumer.stop();
            await kafkaProducer.disconnect();
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
