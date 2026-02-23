import { model, Schema, Types } from "mongoose";

export interface IContact {
    userId: Types.ObjectId;
    contactId: Types.ObjectId;
    savedName?: string;
}

const contactSchema = new Schema<IContact>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        contactId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        savedName: String,
    },
    { timestamps: true }
);

contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

export const Contact = model<IContact>("Contact", contactSchema);