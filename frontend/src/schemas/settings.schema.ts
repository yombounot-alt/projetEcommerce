import { z } from "zod";

export const settingsFormSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, "Nom trop court")
    .max(100, "Nom trop long (100 caractères maximum)"),
  supportEmail: z.string().trim().min(1, "L'email est requis").email("Email invalide"),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
