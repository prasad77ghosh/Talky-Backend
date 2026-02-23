import { model, Schema, Types } from "mongoose";

export interface IMessageStatus {
    messageId: Types.ObjectId;
    userId: Types.ObjectId;
    status: "sent" | "delivered" | "read";
    timestamp: Date;
}

const messageStatusSchema = new Schema<IMessageStatus>(
    {
        messageId: { type: Schema.Types.ObjectId, ref: "Message", index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            required: true,
        },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

messageStatusSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const MessageStatus = model<IMessageStatus>(
    "MessageStatus",
    messageStatusSchema
);