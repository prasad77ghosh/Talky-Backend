import http from "http";
import { App } from "./app";
import { port } from "./config";
import { DatabaseConnection } from "./infrastructure/database/db.connection";

async function bootstrap() {
    try {

        // db connection
        const db = DatabaseConnection.getInstance();
        await db.connect();

        // server setup
        const appInstance = new App();
        const app = appInstance.getServer();
        const server = http.createServer(app);
        server.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });

        const shutdown = (signal: string) => {
            console.log(`⚠️ ${signal} received. Shutting down gracefully...`);

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
