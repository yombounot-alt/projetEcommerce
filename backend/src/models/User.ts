import { Schema, model, type Document, type Types } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export type Role = "admin" | "seller" | "customer";
export type UserStatus = "active" | "suspended" | "pending";

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  status: UserStatus;
  isVerified: boolean;
  avatarUrl?: string;
  addresses: Types.DocumentArray<IAddress>;
  tokenVersion: number;
  lastActiveAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

// Sans ceci, les sous-documents renvoient `_id` (jamais transformé par le toJSONPlugin du
// schéma parent, qui ne s'applique pas en cascade aux tableaux imbriqués) — le frontend
// s'attend à `id` comme pour tous les autres modèles.
toJSONPlugin(addressSchema);

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: { type: String, trim: true, maxlength: 30 },
    password: { type: String, required: true, minlength: 60, select: false },
    role: { type: String, enum: ["admin", "seller", "customer"], default: "customer", index: true },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
      index: true,
    },
    isVerified: { type: Boolean, default: false },
    avatarUrl: { type: String },
    addresses: { type: [addressSchema], default: [] },
    tokenVersion: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

toJSONPlugin(userSchema, [
  "password",
  "tokenVersion",
  "passwordResetTokenHash",
  "passwordResetExpires",
  "emailVerificationTokenHash",
  "emailVerificationExpires",
]);

export const User = model<IUser>("User", userSchema);
