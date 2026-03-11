import { EachMessagePayload } from "kafkajs";
import { VERIFICATION_MESSAGE } from "../../config/kafka.config";
import { KafkaConsumer } from "../../infrastructure/kafka/consumer";
import { mailService } from "../../infrastructure/mail/mail.service";

export class AuthConsumer {
    private static consumer = new KafkaConsumer("auth-group");

    static async start() {
        await this.consumer.connect();
        await this.consumer.subscribe(VERIFICATION_MESSAGE);

        await this.consumer.runWithRetry(async ({ topic, message }: EachMessagePayload) => {
            const value = message.value?.toString();
            if (!value) return;

            const data = JSON.parse(value);
            const { email, phone, token, otp } = data;

            console.log(`📩 [Main] Received message on topic: ${topic} for ${email || phone}`);
            
            await this.processMessage(email, phone, token, otp);
        });
    }

    /**
     * Starts a specialized consumer for DLQ messages.
     * In production, this might be triggered manually or run in a separate 'recovery' worker.
     */
    static async startDLQ() {
        const dlqConsumer = new KafkaConsumer("auth-dlq-group");
        await dlqConsumer.connect();
        await dlqConsumer.subscribe(`${VERIFICATION_MESSAGE}.dlq`);

        console.log(`🛠️ [Recovery] DLQ Consumer started for ${VERIFICATION_MESSAGE}.dlq`);

        await dlqConsumer.runWithRetry(async ({ message }: EachMessagePayload) => {
            const value = message.value?.toString();
            if (!value) return;

            const dlqData = JSON.parse(value);
            const originalPayload = dlqData.payload ? JSON.parse(dlqData.payload) : null;
            
            if (!originalPayload) {
                console.error("❌ [Recovery] No original payload found in DLQ message:", dlqData);
                return;
            }

            const { email, phone, token, otp } = originalPayload;
            console.log(`🛠️ [Recovery] Retrying message for ${email || phone}...`);

            try {
                await this.processMessage(email, phone, token, otp);
                console.log(`✅ [Recovery] Successfully re-processed message for ${email || phone}`);
            } catch (error) {
                console.error(`❌ [Recovery] Re-processing failed again for ${email || phone}:`, error);
                throw error; // Let runWithRetry handle escalation (e.g. to a .dlq.dlq topic or alert)
            }
        });
    }

    static async stop() {
        await this.consumer.disconnect();
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
}
