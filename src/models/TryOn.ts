import mongoose, { Document, Schema } from "mongoose";

export interface ITryOn extends Document {
  clerkUserId: string;
  userId?: mongoose.Types.ObjectId; // Reference to our internal User model
  productId: string;
  variantId?: string;
  shop: string;
  originalImageUrl: string;
  resultImageUrl?: string;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: Date;
}

const TryOnSchema: Schema = new Schema({
  clerkUserId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  productId: { type: String, required: true },
  variantId: { type: String },
  shop: { type: String, required: true },
  originalImageUrl: { type: String, required: true },
  resultImageUrl: { type: String },
  status: {
    type: String,
    enum: ["pending", "processing", "done", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITryOn>("TryOn", TryOnSchema);
