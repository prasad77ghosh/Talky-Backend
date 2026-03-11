import { Request, Response, NextFunction } from "express";
import { fieldValidateError } from "../../common/utils/field-validator";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../common/utils/async-handler";
import { AppError } from "../../common/error/app-error";

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
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            throw new AppError("Verification token is required", 400);
        }

        await this.authService.verifyEmail(token);

        res.status(200).json({
            success: true,
            msg: "Email verified successfully. You can now log in.",
        });
    });

    public login = asyncHandler(async (req: Request, res: Response) => {
        fieldValidateError(req);
        const { email, password } = req.body;
        const deviceInfo = {
            device: req.headers["user-agent"] || "unknown",
            ip: req.ip || req.socket.remoteAddress || "unknown",
        };
        const result = await this.authService.loginWithEmail(email, password, deviceInfo);

        res.status(200).json({
            success: true,
            msg: "Login successful.",
            data: result,
        });
    });

    public loginWithPhone = asyncHandler(async (req: Request, res: Response) => {
        fieldValidateError(req);
        const { phone } = req.body;
        await this.authService.loginWithPhone(phone);
        res.status(200).json({
            success: true,
            msg: "OTP sent to your phone number.",
        });
    });

    public verifyPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
        fieldValidateError(req);
        const { phone, otp } = req.body;
        const deviceInfo = {
            device: req.headers["user-agent"] || "unknown",
            ip: req.ip || req.socket.remoteAddress || "unknown",
        };

        const { user, accessToken, refreshToken } = await this.authService.verifyPhoneOtp(phone, otp, deviceInfo);

        res.status(200).json({
            success: true,
            msg: "Login successful.",
            data: { user, accessToken, refreshToken },
        });
    });

    public logout = asyncHandler(async (req: Request, res: Response) => {
        const { userId, refreshToken } = req.body;
        if (!userId || !refreshToken) {
            throw new AppError("UserId and RefreshToken are required for logout", 400);
        }
        await this.authService.logout(userId, refreshToken);
        res.status(200).json({
            success: true,
            msg: "Logged out successfully from this device.",
        });
    });

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
