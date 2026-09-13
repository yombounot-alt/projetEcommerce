import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export type ProductStatus = "draft" | "published" | "archived";

export interface IProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: "cm" | "in";
}

/** One purchasable combination (e.g. "Rouge / M") of a variant product's options. */
export interface IProductVariant {
  _id: Types.ObjectId;
  sku: string;
  /** e.g. { Taille: "M", Couleur: "Rouge" } — keys mirror IProduct.variantOptions[].name. */
  attributes: Record<string, string>;
  /** Overrides the parent product's price/compareAtPrice when set. */
  price?: number;
  compareAtPrice?: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  image?: string;
}

/** One option group a variant product is sold by, e.g. { name: "Taille", values: ["S","M","L"] }. */
export interface IProductVariantOption {
  name: string;
  values: string[];
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
  /** Option groups this product is sold by (e.g. Taille, Couleur) — empty for simple products. */
  variantOptions: IProductVariantOption[];
  /**
   * Purchasable combinations when this product has variants. When non-empty, the top-level
   * price/availableStock/reservedStock/soldStock become a denormalized aggregate (min price,
   * summed stock) recomputed by product.service.ts on every variant write — kept in sync so
   * search/filter/sort/list-display code never needs to special-case variant products. Real
   * reservations always happen on the variant itself (see stock.service.ts).
   */
  variants: IProductVariant[];
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

const productVariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true, uppercase: true, trim: true },
  attributes: { type: Schema.Types.Mixed, required: true },
  price: { type: Number, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  availableStock: { type: Number, required: true, default: 0, min: 0 },
  reservedStock: { type: Number, required: true, default: 0, min: 0 },
  soldStock: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String },
});

const productVariantOptionSchema = new Schema<IProductVariantOption>(
  {
    name: { type: String, required: true, trim: true },
    values: { type: [String], required: true },
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
    variantOptions: { type: [productVariantOptionSchema], default: [] },
    variants: { type: [productVariantSchema], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ seller: 1, status: 1 });

toJSONPlugin(productSchema);

export const Product = model<IProduct>("Product", productSchema);
