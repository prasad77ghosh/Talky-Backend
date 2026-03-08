import jwt from "jsonwebtoken";
import { IUser } from "../../modules/user/user.model";
import { jwt_access_secret, jwt_refresh_secret, jwt_email_secret } from "../../config";
import { EmailTokenPayload } from "../../types/email-token-payload";

export function generateEmailVerificationToken(user: IUser) {
    const payload: EmailTokenPayload = {
        sub: user?._id?.toString(),
        version: user.verificationVersion,
        type: "email_verification",
    };

    return jwt.sign(payload, jwt_email_secret, {
        expiresIn: "15m",
    });
}

export function verifyEmailToken(token: string): EmailTokenPayload {
    return jwt.verify(token, jwt_email_secret) as EmailTokenPayload;
}

export function generateAccessToken(user: IUser) {
    const payload = {
        sub: user?._id?.toString(),
    };

    return jwt.sign(payload, jwt_access_secret, {
        expiresIn: "1d",
    });
}

export function generateRefreshToken(user: IUser) {
    const payload = {
        sub: user?._id?.toString(),
    };

    return jwt.sign(payload, jwt_refresh_secret, {
        expiresIn: "7d",
    });
}
