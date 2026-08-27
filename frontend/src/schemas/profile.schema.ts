import { z } from "zod";

export const profileFormSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom trop court").max(50),
  lastName: z.string().trim().min(2, "Nom trop court").max(50),
  email: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s().-]*$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const addressFormSchema = z.object({
  label: z.string().trim().min(2, "Libellé requis (ex: Domicile, Bureau)"),
  fullName: z.string().trim().min(2, "Nom complet requis"),
  line1: z.string().trim().min(3, "Adresse requise"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "Ville requise"),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().min(2, "Code postal requis"),
  country: z.string().trim().min(2, "Pays requis"),
  phone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone invalide")
    .regex(/^[0-9+\s().-]+$/, "Numéro de téléphone invalide"),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export const couponFormSchema = z.object({
  code: z.string().trim().min(1, "Veuillez saisir un code promo").toUpperCase(),
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;

export const newsletterFormSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
});

export type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;
