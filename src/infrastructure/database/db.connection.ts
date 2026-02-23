import mongoose from "mongoose";
import { DatabaseConfig } from "../../config/db.config";

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
            await mongoose.connect(
                DatabaseConfig.uri,
                DatabaseConfig.options
            );

            this.registerEvents();

            console.log("✅ MongoDB Connected");
        } catch (error) {
            console.error("❌ MongoDB Connection Failed:", error);
            process.exit(1);
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