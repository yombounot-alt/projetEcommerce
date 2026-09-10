import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

toJSONPlugin(categorySchema);

export const Category = model<ICategory>("Category", categorySchema);
