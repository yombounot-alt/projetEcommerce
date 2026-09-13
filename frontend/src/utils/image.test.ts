import { describe, expect, it } from "vitest";
import { optimizedImageUrl } from "./image";

describe("optimizedImageUrl", () => {
  it("insère les paramètres de transformation dans une URL Cloudinary", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1234/lumera/product.jpg";
    expect(optimizedImageUrl(url, 400)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400/v1234/lumera/product.jpg",
    );
  });

  it("laisse une URL non-Cloudinary inchangée (ex: Unsplash, données de démo)", () => {
    const url = "https://images.unsplash.com/photo-123";
    expect(optimizedImageUrl(url, 400)).toBe(url);
  });

  it("laisse une URL locale inchangée (fallback disque sans Cloudinary configuré)", () => {
    const url = "/uploads/1234-abcd.jpg";
    expect(optimizedImageUrl(url, 400)).toBe(url);
  });

  it("laisse une chaîne vide inchangée", () => {
    expect(optimizedImageUrl("", 400)).toBe("");
  });
});
