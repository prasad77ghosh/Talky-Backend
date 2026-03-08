import { Schema, model, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
    _id?: Types.ObjectId;
    phone?: string;
    isVerified?: boolean;
    verificationVersion?: number;
    username?: string;
    name?: string;
    bio?: string;
    avatar?: string;
    lastSeen?: Date;
    isOnline: boolean;
    password?: string;
    settings: {
        privacyLastSeen: "everyone" | "contacts" | "nobody";
        readReceipts: boolean;
    };
}

const userSchema = new Schema<IUser>(
    {
        phone: { type: String, unique: true, index: true },
        username: { type: String, unique: true, sparse: true },
        name: { type: String },
        password: { type: String },
        isVerified: { type: Boolean, default: false },
        verificationVersion: { type: Number, default: 0 },
        bio: String,
        avatar: String,
        lastSeen: Date,
        isOnline: { type: Boolean, default: false },
        settings: {
            privacyLastSeen: {
                type: String,
                enum: ["everyone", "contacts", "nobody"],
                default: "everyone",
            },
            readReceipts: { type: Boolean, default: true },
        },
    },
    { timestamps: true },
);


export const User = model<IUser>("User", userSchema);
