import { model, Schema, Types } from "mongoose";

export interface ICall {
    chatId: Types.ObjectId;
    callerId: Types.ObjectId;
    participants: Types.ObjectId[];
    type: "audio" | "video";
    status: "missed" | "ended" | "rejected";
    startedAt: Date;
    endedAt?: Date;
}

const callSchema = new Schema<ICall>(
    {
        chatId: { type: Schema.Types.ObjectId, ref: "Chat", index: true },
        callerId: { type: Schema.Types.ObjectId, ref: "User" },
        participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
        type: { type: String, enum: ["audio", "video"], required: true },
        status: {
            type: String,
            enum: ["missed", "ended", "rejected"],
            required: true,
        },
        startedAt: { type: Date, default: Date.now },
        endedAt: Date,
    },
    { timestamps: true }
);

export const Call = model<ICall>("Call", callSchema);