import express, { Application } from "express";
import cors from "cors";
import { errorMiddleware } from "./common/error/error.middleware";
import { notFoundMiddleware } from "./common/error/not-found.middleware";
import router from "./router";

export class App {
    public app: Application;
    constructor() {
        this.app = express();

        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes() {
        this.app.get("/", (req, res) => {
            res.json({ message: "Welcome to Talky API" });
        });
        this.app.use(router);
    }

    private initializeErrorHandling() {
        this.app.use(notFoundMiddleware);
        this.app.use(errorMiddleware);
    }

    public getServer() {
        return this.app;
    }
}
