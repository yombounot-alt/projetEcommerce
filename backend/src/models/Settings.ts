import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

/**
 * Document singleton (une seule ligne en base) pour les réglages globaux de la plateforme.
 * getOrCreateSettings() garantit qu'il n'en existe jamais plus d'un.
 */
export interface ISettings extends Document {
  _id: Types.ObjectId;
  storeName: string;
  supportEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, required: true, trim: true, maxlength: 100, default: "Lumera" },
    supportEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "support@lumera.example",
    },
  },
  { timestamps: true },
);

toJSONPlugin(settingsSchema);

export const Settings = model<ISettings>("Settings", settingsSchema);
