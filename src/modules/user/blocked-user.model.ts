import { model, Schema, Types } from "mongoose";

export interface IBlock {
    userId: Types.ObjectId;
    blockedUserId: Types.ObjectId;
}

const blockSchema = new Schema<IBlock>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        blockedUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    },
    { timestamps: true }
);

blockSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

export const Block = model<IBlock>("Block", blockSchema);