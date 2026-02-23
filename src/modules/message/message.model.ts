import { model, Schema, Types } from "mongoose";

export interface IMessage {
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: "text" | "image" | "video" | "file" | "audio";
    content: {
        text?: string;
        mediaUrl?: string;
        fileName?: string;
        fileSize?: number;
    };
    replyTo?: Types.ObjectId;
    forwardedFrom?: Types.ObjectId;
    edited: boolean;
    deletedFor: Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
    {
        chatId: { type: Schema.Types.ObjectId, ref: "Chat", index: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        type: {
            type: String,
            enum: ["text", "image", "video", "file", "audio"],
            required: true,
        },
        content: {
            text: String,
            mediaUrl: String,
            fileName: String,
            fileSize: Number,
        },
        replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
        forwardedFrom: { type: Schema.Types.ObjectId, ref: "Message" },
        edited: { type: Boolean, default: false },
        deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);