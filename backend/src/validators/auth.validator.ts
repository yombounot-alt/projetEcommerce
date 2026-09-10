import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "8 caractères minimum")
  .regex(/[A-Z]/, "Une majuscule minimum")
  .regex(/[0-9]/, "Un chiffre minimum");

export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: z.string().trim().min(1).email(),
  phone: z.string().trim().optional(),
  password: strongPassword,
});

export const loginSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1).email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: strongPassword,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

const addressSchema = z.object({
  label: z.string().trim().min(2).max(60),
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .min(6)
    .regex(/^[0-9+\s().-]+$/, "Numéro de téléphone invalide"),
  isDefault: z.boolean().optional().default(false),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  email: z.string().trim().min(1).email().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s().-]*$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url().optional(),
});

export const addAddressSchema = addressSchema;
export const updateAddressSchema = addressSchema.partial();
