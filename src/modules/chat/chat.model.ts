import { model, Schema, Types } from "mongoose";

export interface IChat {
    type: "private" | "group";
    participants: Types.ObjectId[];
    groupInfo?: {
        name: string;
        description?: string;
        avatar?: string;
        admins: Types.ObjectId[];
    };
    lastMessage?: {
        messageId: Types.ObjectId;
        text: string;
        sender: Types.ObjectId;
        createdAt: Date;
    };
}

const chatSchema = new Schema<IChat>(
    {
        type: { type: String, enum: ["private", "group"], required: true },
        participants: [
            { type: Schema.Types.ObjectId, ref: "User", index: true },
        ],
        groupInfo: {
            name: String,
            description: String,
            avatar: String,
            admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
        lastMessage: {
            messageId: { type: Schema.Types.ObjectId, ref: "Message" },
            text: String,
            sender: { type: Schema.Types.ObjectId, ref: "User" },
            createdAt: Date,
        },
    },
    { timestamps: true }
);

chatSchema.index({ participants: 1 });

export const Chat = model<IChat>("Chat", chatSchema);