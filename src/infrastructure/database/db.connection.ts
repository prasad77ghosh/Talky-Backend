import mongoose from "mongoose";
import { DatabaseConfig } from "../../config/db.config";
import { withRetry } from "../../common/utils/retry.utils";

export class DatabaseConnection {
    private static instance: DatabaseConnection;

    private constructor() { }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<void> {
        try {
            await withRetry(
                async (attempt) => {
                    await mongoose.connect(
                        DatabaseConfig.uri,
                        DatabaseConfig.options
                    );
                },
                { maxRetries: 5, initialDelay: 2000 },
                (error, attempt, delay) => {
                    console.warn(`⏳ MongoDB Connection attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
                }
            );

            this.registerEvents();

            console.log("✅ MongoDB Connected");
        } catch (error) {
            console.error("❌ MongoDB Connection Failed after all retries:", error);
            throw error; // Let the caller (worker/server) handle the fatal error
        }
    }

    private registerEvents(): void {
        mongoose.connection.on("connected", () => {
            console.log("🟢 MongoDB connection established");
        });

        mongoose.connection.on("error", (err) => {
            console.error("🔴 MongoDB error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("🟡 MongoDB disconnected");
        });
    }
}