import { Request } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../error/app-error";
export const fieldValidateError = (req: Request) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError(
            errors
                .array()
                .map((errors) => errors.msg)
                .join()
                .replace(/[,]/g, " and "), 500
        );
    }
};