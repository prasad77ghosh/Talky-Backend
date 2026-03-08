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
            const { email, phone, token, otp } = data;

            console.log(`📩 Received message on topic: ${topic} for ${email || phone}`);

            try {
                await this.processMessage(email, phone, token, otp);
            } catch (error) {
                console.error(`❌ Failed to process message for ${email || phone}, initiating retry...`, error);
                await this.handleRetry(email, phone, token, otp, 1);
            }
        });
    }

    private static async processMessage(email?: string, phone?: string, token?: string, otp?: string) {
        if (email && token) {
            await mailService.sendMail({
                to: email,
                subject: "Verify Your Email - Talky",
                html: `<h1>Welcome to Talky!</h1>
                       <p>Please verify your email by clicking the link below:</p>
                       <p>Verification Token: <b>${token}</b></p>
                       <a href="http://localhost:5000/api/v1/auth/verify-mail?token=${token}">Verify Email</a>`,
            });
        } else if (email && otp) {
            await mailService.sendMail({
                to: email,
                subject: "Your OTP for Authentication - Talky",
                html: `<h1>Auth OTP</h1>
                       <p>Your OTP for authentication is: <b>${otp}</b></p>
                       <p>This OTP will expire in 5 minutes.</p>`,
            });
        } else if (phone && otp) {
            // Placeholder for SMS service
            console.log(`📱 [SMS SIMULATION] Sending OTP ${otp} to phone: ${phone}`);
        }
    }

    private static async handleRetry(email: string | undefined, phone: string | undefined, token: string | undefined, otp: string | undefined, attempt: number) {
        if (attempt > this.MAX_RETRIES) {
            console.error(`🚨 Max retries reached for ${email || phone}. Message failed to send.`);
            return;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying attempt ${attempt} for ${email || phone} in ${delay}ms...`);

        setTimeout(async () => {
            try {
                await this.processMessage(email, phone, token, otp);
                console.log(`✅ Successfully sent message to ${email || phone} on attempt ${attempt}`);
            } catch (error) {
                await this.handleRetry(email, phone, token, otp, attempt + 1);
            }
        }, delay);
    }
}
