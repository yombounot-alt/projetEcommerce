import { Schema, model, Types, type Document } from "mongoose";

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    products: { type: [{ type: Schema.Types.ObjectId, ref: "Product" }], default: [] },
  },
  { timestamps: true },
);

export const Wishlist = model<IWishlist>("Wishlist", wishlistSchema);
