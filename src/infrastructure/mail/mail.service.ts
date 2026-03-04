import nodemailer from "nodemailer";
import { mailConfig } from "../../config/mail.config";

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
            const info = await this.transporter.sendMail({
                from: mailConfig.from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
            console.log("📧 Email sent: %s", info.messageId);
        } catch (error) {
            console.error("❌ Failed to send email:", error);
            throw error;
        }
    }
}

export const mailService = new MailService();
