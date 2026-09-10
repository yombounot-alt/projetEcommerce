import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export type ProductStatus = "draft" | "published" | "archived";

export interface IProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: "cm" | "in";
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  category: Types.ObjectId;
  brand?: Types.ObjectId;
  seller: Types.ObjectId;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  lowStockThreshold: number;
  weightKg?: number;
  dimensions?: IProductDimensions;
  specifications: Record<string, string>;
  status: ProductStatus;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const dimensionsSchema = new Schema<IProductDimensions>(
  {
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    depth: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ["cm", "in"], default: "cm" },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, maxlength: 20_000 },
    shortDescription: { type: String, required: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, required: true, default: "GNF", uppercase: true, maxlength: 3 },
    images: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= 10, "Maximum 10 images"],
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    availableStock: { type: Number, required: true, default: 0, min: 0 },
    reservedStock: { type: Number, required: true, default: 0, min: 0 },
    soldStock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    weightKg: { type: Number, min: 0 },
    dimensions: { type: dimensionsSchema },
    specifications: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ seller: 1, status: 1 });

toJSONPlugin(productSchema);

export const Product = model<IProduct>("Product", productSchema);
