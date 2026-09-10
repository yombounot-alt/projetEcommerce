import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export interface IBrand extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logoUrl: { type: String },
  },
  { timestamps: true },
);

toJSONPlugin(brandSchema);

export const Brand = model<IBrand>("Brand", brandSchema);
