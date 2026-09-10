import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";

export const uploadService = {
  /**
   * En mode mock, on crée une URL d'objet locale au navigateur (aucun vrai stockage) :
   * elle reste valide pour la session en cours, ce qui suffit à prévisualiser l'image
   * dans le formulaire sans dépendre d'un backend.
   */
  async uploadImages(files: File[]): Promise<string[]> {
    if (env.useMocks) {
      const urls = files.map((file) => URL.createObjectURL(file));
      return mockDelay(urls, 400);
    }
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const { data } = await httpClient.post<{ urls: string[] }>("/uploads/images", formData, {
      headers: { "Content-Type": undefined },
    });
    return data.urls;
  },
};
