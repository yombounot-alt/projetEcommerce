import { Schema, model, Types, type Document } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1, max: 999 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
    // Without this, Mongoose only version-guards a narrow set of array operations on
    // save() — a plain array reassignment (as cart.service.ts's read-modify-write does)
    // would save successfully even when the document changed concurrently, silently
    // overwriting another request's update. This makes save() check `__v` on any
    // modified path, throwing VersionError on a real conflict — see
    // cart.service.ts#saveWithRetry, which retries on exactly that error.
    optimisticConcurrency: true,
  },
);

export const Cart = model<ICart>("Cart", cartSchema);
