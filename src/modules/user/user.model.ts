import { Schema, model, Types } from "mongoose";

export interface IUser {
    phone?: string;
    username?: string;
    name: string;
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
        phone: { type: String, required: true, unique: true, index: true },
        username: { type: String, unique: true, sparse: true },
        name: { type: String, required: true },
        password: { type: String, required: true },
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
