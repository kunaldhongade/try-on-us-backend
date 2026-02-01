import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  personImages: string[];
  tryOns: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    profileImageUrl: { type: String },
    personImages: [{ type: String }],
    tryOns: [{ type: Schema.Types.ObjectId, ref: "TryOn" }],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IUser>("User", UserSchema);
