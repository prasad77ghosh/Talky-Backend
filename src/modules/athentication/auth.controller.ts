import { Request, Response, NextFunction } from "express";
import { fieldValidateError } from "../../common/utils/field-validator";
import { AuthService } from "./auth.service";

class AuthController {
    private async registerWithUsername(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        fieldValidateError(req);
        const user = await new AuthService().registerWithUsername(req.body);
        res.status(201).json({
            success: true,
            msg: "User registered successfully...",
            data: user,
        });
    }

    private verifyUser(req: Request, res: Response, next: NextFunction) { }

    private login(req: Request, res: Response, next: NextFunction) {
        fieldValidateError(req);
        
    }

    private logout(req: Request, res: Response, next: NextFunction) { }

    private forgotPassword(req: Request, res: Response, next: NextFunction) { }

    private resetPassword(req: Request, res: Response, next: NextFunction) { }
}
