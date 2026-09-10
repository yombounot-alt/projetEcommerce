import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export interface IReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  author: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One review per product per author — prevents unlimited spam reviews (rule 25).
reviewSchema.index({ product: 1, author: 1 }, { unique: true });

toJSONPlugin(reviewSchema);

export const Review = model<IReview>("Review", reviewSchema);
