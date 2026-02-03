import mongoose, { Document, Schema } from "mongoose";
const UserSchema = new Schema({
    clerkUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    profileImageUrl: { type: String },
    personImages: [{ type: String }],
    tryOns: [{ type: Schema.Types.ObjectId, ref: "TryOn" }],
}, {
    timestamps: true,
});
export default mongoose.model("User", UserSchema);
//# sourceMappingURL=User.js.map