import express, { Application } from "express";
import { errorMiddleware } from "./common/error/error.middleware";
import { notFoundMiddleware } from "./common/error/not-found.middleware";

export class App {
    public app: Application;
    constructor() {
        this.app = express();

        this.initializeErrorHandling();
    }

    private initializeErrorHandling() {
        this.app.use(notFoundMiddleware);
        this.app.use(errorMiddleware);
    }

    public getServer() {
        return this.app;
    }
}
