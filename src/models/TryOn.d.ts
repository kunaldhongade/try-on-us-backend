import mongoose, { Document } from "mongoose";
export interface ITryOn extends Document {
    clerkUserId: string;
    userId?: mongoose.Types.ObjectId;
    productId: string;
    variantId?: string;
    shop: string;
    originalImageUrl: string;
    resultImageUrl?: string;
    status: "pending" | "processing" | "done" | "failed";
    createdAt: Date;
}
declare const _default: mongoose.Model<ITryOn, {}, {}, {}, mongoose.Document<unknown, {}, ITryOn, {}, mongoose.DefaultSchemaOptions> & ITryOn & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITryOn>;
export default _default;
//# sourceMappingURL=TryOn.d.ts.map