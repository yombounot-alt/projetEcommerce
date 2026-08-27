import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Prénom trop court").max(50),
    lastName: z.string().trim().min(2, "Nom trop court").max(50),
    email: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/[A-Z]/, "Une majuscule minimum")
      .regex(/[0-9]/, "Un chiffre minimum"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: "Vous devez accepter les conditions générales" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/[A-Z]/, "Une majuscule minimum")
      .regex(/[0-9]/, "Un chiffre minimum"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
