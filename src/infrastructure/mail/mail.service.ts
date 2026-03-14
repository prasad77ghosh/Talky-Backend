import nodemailer from "nodemailer";
import { mailConfig } from "../../config/mail.config";
import { withRetry } from "../../common/utils/retry.utils";

export interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

class MailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port,
            secure: mailConfig.secure,
            auth: mailConfig.auth,
        });
    }

    async sendMail(options: MailOptions): Promise<void> {
        try {
            await withRetry(
                async (attempt) => {
                    const info = await this.transporter.sendMail({
                        from: mailConfig.from,
                        to: options.to,
                        subject: options.subject,
                        text: options.text,
                        html: options.html,
                    });
                    console.log("📧 Email sent: %s", info.messageId);
                },
                { maxRetries: 2, initialDelay: 5000 }, // Email retries usually need more initial delay
                (error, attempt, delay) => {
                    console.warn(`⏳ Email sending failed (attempt ${attempt}). Retrying in ${Math.round(delay)}ms...`);
                }
            );
        } catch (error) {
            console.error("❌ Failed to send email after all retries:", error);
            throw error;
        }
    }
}

export const mailService = new MailService();
