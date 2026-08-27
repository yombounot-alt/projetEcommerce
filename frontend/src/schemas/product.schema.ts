import { z } from "zod";

export const productFormSchema = z
  .object({
    name: z.string().trim().min(3, "Le nom doit contenir au moins 3 caractères").max(150),
    description: z.string().trim().min(20, "Description trop courte (20 caractères minimum)"),
    shortDescription: z.string().trim().max(200),
    sku: z
      .string()
      .trim()
      .min(3, "SKU requis")
      .regex(/^[A-Z0-9-]+$/, "SKU en majuscules, chiffres et tirets uniquement"),
    price: z.coerce.number().positive("Le prix doit être positif"),
    compareAtPrice: z.coerce.number().positive().optional(),
    categoryId: z.string().min(1, "Catégorie requise"),
    brandId: z.string().optional(),
    stock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif"),
    weightKg: z.coerce.number().positive().optional(),
    images: z.array(z.string().url()).min(1, "Au moins une image est requise"),
    status: z.enum(["draft", "published", "archived"]),
  })
  .refine(
    (data) => !data.compareAtPrice || data.compareAtPrice > data.price,
    {
      message: "Le prix barré doit être supérieur au prix de vente",
      path: ["compareAtPrice"],
    },
  );

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
  rating: z.coerce.number().int().min(1, "Note requise").max(5),
  title: z.string().trim().min(3, "Titre trop court").max(120),
  comment: z.string().trim().min(10, "Commentaire trop court (10 caractères minimum)").max(2000),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
