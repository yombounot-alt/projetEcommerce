import type { Schema } from "mongoose";

/**
 * Normalizes a model's JSON shape for the frontend contract: `_id` -> `id` (string),
 * drop `__v`, and strip any explicitly listed private fields (password hashes, token
 * versions, ...) so they can never leak through res.json even if a controller forgets
 * to .select() them out.
 */
export function toJSONPlugin(schema: Schema, privateFields: string[] = []): void {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      for (const field of privateFields) {
        delete ret[field];
      }
      return ret;
    },
  });
}
