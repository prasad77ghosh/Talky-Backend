import { AppError } from "../../common/error/app-error";
import { generateEmailVerificationToken } from "../../common/utils/jwt.utils";
import { VERIFICATION_MESSAGE } from "../../config/kafka.config";
import { kafkaProducer } from "../../infrastructure/kafka/producer";
import { IUser, User } from "../user/user.model";
import { RegisterType } from "./auth.type";
import { redisClient } from "../../infrastructure/redis/redis.connection";

export class AuthService {
    async registerWithUsername({
        input,
    }: {
        input: RegisterType;
    }): Promise<Partial<IUser>> {
        const user = await User.create({
            name: input.name,
            username: input.email,
            password: input.password,
        });

        if (!user) throw new AppError("Failed to create user", 500);

        // generate email verification token
        const token = generateEmailVerificationToken(user);

        // send verification email to user email (use queue for better performance and reliability)
        await this.produceMessage(user._id.toString(), {
            email: user.username,
            token,
        });

        // store verification token in redis with expiry time
        await redisClient.set(`verify_email:${user.username}`, token, "EX", 60 * 15); // 15 minutes

        return user;
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await User.findOne({ username: email });
        if (!user) throw new AppError("User not found", 404);

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Send OTP via Kafka
        await this.produceMessage(user._id.toString(), {
            email,
            otp,
        });

        // Store OTP in redis with expiry (e.g., 5 minutes)
        await redisClient.set(`otp:${email}`, otp, "EX", 60 * 5);

        console.log(`✅ Stored OTP for ${email} in Redis`);
    }

    private async produceMessage(key: string, data: any) {
        try {
            await kafkaProducer.send(VERIFICATION_MESSAGE, key, data);
        } catch (error) {
            console.error("❌ Failed to produce message to Kafka", error);
            // In a real application, you might want to handle this differently, e.g., throw or fallback
        }
    }
}
