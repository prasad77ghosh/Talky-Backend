import { Schema, model, Types } from "mongoose";

export interface ISession {
    userId: Types.ObjectId;
    deviceId: string;
    refreshToken: string;
    expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        deviceId: { type: String, required: true },
        refreshToken: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

sessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>("Session", sessionSchema);