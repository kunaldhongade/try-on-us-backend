import mongoose, { Document, Schema } from "mongoose";
const TryOnSchema = new Schema({
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
export default mongoose.model("TryOn", TryOnSchema);
//# sourceMappingURL=TryOn.js.map