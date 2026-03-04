import { Request, Response, NextFunction } from "express";
import { fieldValidateError } from "../../common/utils/field-validator";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../common/utils/async-handler";

class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public registerWithUsername = asyncHandler(async (
        req: Request,
        res: Response,
    ) => {
        fieldValidateError(req);
        const user = await this.authService.registerWithUsername({ input: req.body });
        res.status(201).json({
            success: true,
            msg: "User registered successfully, please verify your email.",
            data: user,
        });
    });

    public verifyUser = asyncHandler(async (req: Request, res: Response) => {
        // Verification logic here
    });

    public login = asyncHandler(async (req: Request, res: Response) => {
        fieldValidateError(req);
        // Login logic here
    });

    public logout = asyncHandler(async (req: Request, res: Response) => { });

    public forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        fieldValidateError(req);
        const { email } = req.body;
        await this.authService.forgotPassword(email);
        res.status(200).json({
            success: true,
            msg: "OTP sent to your email successfully.",
        });
    });

    public resetPassword = asyncHandler(async (req: Request, res: Response) => { });
}

export const authController = new AuthController();
