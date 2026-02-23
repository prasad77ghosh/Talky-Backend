import { Request, Response, NextFunction } from "express";
import { AppError } from "./app-error";
import { node_env } from "../../config";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    if (!(error instanceof AppError)) {
        error = new AppError("Internal Server Error", 500);
    }

    const response = {
        success: false,
        message: error.message,
        statusCode: error.statusCode,
        ...(node_env === "development" && { stack: err.stack }),
    };

    res.status(error.statusCode).json(response);
};