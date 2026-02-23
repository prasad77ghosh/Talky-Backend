import { model, Schema, Types } from "mongoose";

export interface IGroupMember {
    chatId: Types.ObjectId;
    userId: Types.ObjectId;
    role: "member" | "admin";
    joinedAt: Date;
    mutedUntil?: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
    {
        chatId: { type: Schema.Types.ObjectId, ref: "Chat", index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        role: { type: String, enum: ["member", "admin"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
        mutedUntil: Date,
    },
    { timestamps: true }
);

groupMemberSchema.index({ chatId: 1, userId: 1 }, { unique: true });

export const GroupMember = model<IGroupMember>(
    "GroupMember",
    groupMemberSchema
);