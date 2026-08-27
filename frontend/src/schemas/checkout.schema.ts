import { z } from "zod";

export const customerInfoSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
  firstName: z.string().trim().min(2, "Prénom trop court"),
  lastName: z.string().trim().min(2, "Nom trop court"),
  phone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone invalide")
    .regex(/^[0-9+\s().-]+$/, "Numéro de téléphone invalide"),
});

export type CustomerInfoValues = z.infer<typeof customerInfoSchema>;

export const shippingAddressSchema = z.object({
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
  saveAddress: z.boolean(),
});

export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;

export const shippingMethodSchema = z.object({
  methodId: z.string().min(1, "Veuillez sélectionner un mode de livraison"),
});

export type ShippingMethodValues = z.infer<typeof shippingMethodSchema>;

/**
 * Le frontend ne collecte jamais de PAN / CVV : ces champs sont uniquement
 * des identifiants d'intention destinés à un futur prestataire de paiement
 * (ex. Stripe Elements / PaymentIntent) qui gère lui-même les données sensibles.
 */
export const paymentMethodSchema = z.object({
  method: z.enum(["card", "paypal", "bank_transfer", "cash_on_delivery"]),
  billingSameAsShipping: z.boolean(),
});

export type PaymentMethodValues = z.infer<typeof paymentMethodSchema>;
