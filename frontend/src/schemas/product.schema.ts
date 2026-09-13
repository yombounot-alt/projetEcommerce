import { z } from "zod";

export const variantOptionFormSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  values: z.array(z.string().trim().min(1)).min(1, "Au moins une valeur requise"),
});

export const productVariantFormSchema = z.object({
  id: z.string().optional(),
  sku: z
    .string()
    .trim()
    .min(3, "SKU requis")
    .regex(/^[A-Za-z0-9-]+$/, "SKU en lettres, chiffres et tirets uniquement")
    .transform((s) => s.toUpperCase()),
  attributes: z.record(z.string(), z.string()),
  price: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().optional(),
  availableStock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif"),
  image: z.string().url().optional().or(z.literal("")),
});

export type ProductVariantFormValues = z.infer<typeof productVariantFormSchema>;
export type VariantOptionFormValues = z.infer<typeof variantOptionFormSchema>;

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Le nom doit contenir au moins 3 caractères")
      .max(150, "Nom trop long (150 caractères maximum)"),
    description: z.string().trim().min(20, "Description trop courte (20 caractères minimum)"),
    shortDescription: z
      .string()
      .trim()
      .max(200, "Description courte trop longue (200 caractères maximum)"),
    sku: z
      .string()
      .trim()
      .min(3, "SKU requis")
      .regex(/^[A-Z0-9-]+$/, "SKU en majuscules, chiffres et tirets uniquement"),
    price: z.coerce.number().positive("Le prix doit être positif"),
    compareAtPrice: z.coerce.number().positive("Le prix barré doit être positif").optional(),
    categoryId: z.string().min(1, "Catégorie requise"),
    brandId: z.string().optional(),
    stock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif"),
    weightKg: z.coerce.number().positive("Le poids doit être positif").optional(),
    images: z.array(z.string().url("Image invalide")).min(1, "Au moins une image est requise"),
    status: z.enum(["draft", "published", "archived"]),
    variantOptions: z.array(variantOptionFormSchema).optional().default([]),
    variants: z.array(productVariantFormSchema).optional().default([]),
  })
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.price, {
    message: "Le prix barré doit être supérieur au prix de vente",
    path: ["compareAtPrice"],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Nom requis"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug requis")
    .regex(/^[a-z0-9-]+$/, "Slug en minuscules, chiffres et tirets uniquement"),
  description: z.string().trim().optional(),
  parentId: z.string().nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1, "Note requise").max(5, "Note maximale : 5"),
  title: z
    .string()
    .trim()
    .min(3, "Titre trop court")
    .max(120, "Titre trop long (120 caractères maximum)"),
  comment: z
    .string()
    .trim()
    .min(10, "Commentaire trop court (10 caractères minimum)")
    .max(2000, "Commentaire trop long (2000 caractères maximum)"),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
