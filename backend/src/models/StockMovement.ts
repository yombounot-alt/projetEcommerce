import { Schema, model, Types, type Document } from "mongoose";

export type StockMovementType = "IN" | "OUT" | "RESERVED" | "RELEASED" | "ADJUSTMENT";

export interface IStockMovement extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  reason: string;
  order?: Types.ObjectId;
  actor?: Types.ObjectId;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    type: {
      type: String,
      enum: ["IN", "OUT", "RESERVED", "RELEASED", "ADJUSTMENT"],
      required: true,
    },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 300 },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

stockMovementSchema.index({ product: 1, createdAt: -1 });

export const StockMovement = model<IStockMovement>("StockMovement", stockMovementSchema);
