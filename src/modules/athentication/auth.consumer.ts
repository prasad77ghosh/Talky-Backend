import { EachMessagePayload } from "kafkajs";
import { VERIFICATION_MESSAGE } from "../../config/kafka.config";
import { kafkaConsumer } from "../../infrastructure/kafka/consumer";
import { mailService } from "../../infrastructure/mail/mail.service";

export class AuthConsumer {
    private static MAX_RETRIES = 5;

    static async start() {
        await kafkaConsumer.subscribe(VERIFICATION_MESSAGE);

        await kafkaConsumer.run(async ({ topic, partition, message }: EachMessagePayload) => {
            const value = message.value?.toString();
            if (!value) return;

            const data = JSON.parse(value);
            const { email, token, otp } = data;

            console.log(`📩 Received message on topic: ${topic} for ${email}`);

            try {
                await this.processMessage(email, token, otp);
            } catch (error) {
                console.error(`❌ Failed to process message for ${email}, initiating retry...`, error);
                await this.handleRetry(email, token, otp, 1);
            }
        });
    }

    private static async processMessage(email: string, token?: string, otp?: string) {
        if (token) {
            await mailService.sendMail({
                to: email,
                subject: "Verify Your Email - Talky",
                html: `<h1>Welcome to Talky!</h1>
                       <p>Please verify your email by clicking the link below:</p>
                       <p>Verification Token: <b>${token}</b></p>
                       <a href="http://localhost:5000/api/v1/auth/verify-mail?token=${token}">Verify Email</a>`,
            });
        } else if (otp) {
            await mailService.sendMail({
                to: email,
                subject: "Your OTP for Authentication - Talky",
                html: `<h1>Auth OTP</h1>
                       <p>Your OTP for authentication is: <b>${otp}</b></p>
                       <p>This OTP will expire in 5 minutes.</p>`,
            });
        }
    }

    private static async handleRetry(email: string, token: string | undefined, otp: string | undefined, attempt: number) {
        if (attempt > this.MAX_RETRIES) {
            console.error(`🚨 Max retries reached for ${email}. Email failed to send.`);
            return;
        }

        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        console.log(`⏳ Retrying attempt ${attempt} for ${email} in ${delay}ms...`);

        setTimeout(async () => {
            try {
                await this.processMessage(email, token, otp);
                console.log(`✅ Successfully sent email to ${email} on attempt ${attempt}`);
            } catch (error) {
                await this.handleRetry(email, token, otp, attempt + 1);
            }
        }, delay);
    }
}
