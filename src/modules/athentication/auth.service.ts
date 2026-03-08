import { AppError } from "../../common/error/app-error";
import {
  generateEmailVerificationToken,
  verifyEmailToken,
  generateAccessToken,
  generateRefreshToken,
} from "../../common/utils/jwt.utils";
import { VERIFICATION_MESSAGE } from "../../config/kafka.config";
import { kafkaProducer } from "../../infrastructure/kafka/producer";
import { IUser, User } from "../user/user.model";
import { RegisterType } from "./auth.type";
import { redisClient } from "../../infrastructure/redis/redis.connection";
import bcrypt from "bcryptjs";

export class AuthService {
  async registerWithUsername({
    input,
  }: {
    input: RegisterType;
  }): Promise<Partial<IUser>> {
    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      name: input.name,
      username: input.email,
      password: hashed_password,
    });

    if (!user) throw new AppError("Failed to create user", 500);

    // generate email verification token
    const token = generateEmailVerificationToken(user as IUser);

    // send verification email to user email (use queue for better performance and reliability)
    await this.produceMessage((user._id as any).toString(), {
      email: user.username,
      token,
    });

    // store verification token in redis with expiry time
    await redisClient.set(
      `verify_email:${user.username}`,
      token,
      "EX",
      60 * 15,
    ); // 15 minutes

    return user;
  }

  async loginWithEmail(
    email: string,
    password: string,
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ username: email });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isVerified) {
      throw new AppError(
        "Account not verified. Please verify your email first.",
        403,
      );
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Enforce device limit
    await this.trackSession(user._id!.toString(), refreshToken);

    return { user, accessToken, refreshToken };
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = verifyEmailToken(token);
      const user = await User.findById(payload.sub);

      if (!user) throw new AppError("User not found", 404);
      if (user.isVerified) throw new AppError("User is already verified", 400);

      // Check if token exists in Redis
      const storedToken = await redisClient.get(
        `verify_email:${user.username}`,
      );
      if (!storedToken || storedToken !== token) {
        throw new AppError("Invalid or expired verification token", 400);
      }

      // Update user status
      user.isVerified = true;
      await user.save();

      // Delete token from Redis
      await redisClient.del(`verify_email:${user.username}`);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Verification link has expired", 400);
      }
      if (error instanceof AppError) throw error;
      throw new AppError("Invalid verification token", 400);
    }
  }

  async loginWithPhone(phone: string): Promise<void> {
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.produceMessage(user._id!.toString(), {
      phone,
      otp,
    });

    await redisClient.set(`otp:${phone}`, otp, "EX", 60 * 5);
    console.log(`✅ Stored OTP for ${phone} in Redis`);
  }

  async verifyPhoneOtp(
    phone: string,
    otp: string,
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const storedOtp = await redisClient.get(`otp:${phone}`);

    if (!storedOtp || storedOtp !== otp) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const user = await User.findOne({ phone });
    if (!user) throw new AppError("User not found", 404);

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Enforce device limit
    await this.trackSession(user._id!.toString(), refreshToken);

    await redisClient.del(`otp:${phone}`);

    return { user, accessToken, refreshToken };
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

  async logout(userId: string, refreshToken: string): Promise<void> {
    const key = `active_sessions:${userId}`;
    await redisClient.zrem(key, refreshToken);
  }

  private async trackSession(userId: string, refreshToken: string) {
    const key = `active_sessions:${userId}`;
    const now = Date.now();

    // 1. Add current session with timestamp as score
    await redisClient.zadd(key, now, refreshToken);

    // 2. Automatically kick out oldest session(s) if limit exceeded
    // Keeps only the most recent 2 sessions (ranks -1 and -2)
    // Removes everything from rank 0 (oldest) up to -3
    await redisClient.zremrangebyrank(key, 0, -3);

    // 3. Set expiration for the session list (7 days)
    await redisClient.expire(key, 7 * 24 * 60 * 60);
  }

  private async produceMessage(key: string, data: any) {
    try {
      await kafkaProducer.send(VERIFICATION_MESSAGE, key, data);
    } catch (error) {
      console.error("❌ Failed to produce message to Kafka", error);
    }
  }
}
