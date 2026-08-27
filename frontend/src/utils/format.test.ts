import { describe, expect, it } from "vitest";
import { computeDiscountPercentage, formatPrice, getInitials, truncate } from "./format";

describe("formatPrice", () => {
  it("formate un montant dans la devise par défaut (GNF, sans décimales)", () => {
    expect(formatPrice(1990)).toContain("990");
    expect(formatPrice(1990)).not.toContain(",");
    expect(formatPrice(1990)).toContain("GNF");
  });

  it("respecte les décimales propres à une devise explicite (EUR)", () => {
    expect(formatPrice(19.9, "EUR")).toContain("19,90");
  });
});

describe("computeDiscountPercentage", () => {
  it("retourne null si aucun prix barré n'est fourni", () => {
    expect(computeDiscountPercentage(50)).toBeNull();
  });

  it("retourne null si le prix barré n'est pas supérieur au prix", () => {
    expect(computeDiscountPercentage(50, 40)).toBeNull();
  });

  it("calcule correctement le pourcentage de réduction", () => {
    expect(computeDiscountPercentage(75, 100)).toBe(25);
  });
});

describe("truncate", () => {
  it("ne modifie pas un texte plus court que la limite", () => {
    expect(truncate("Bonjour", 20)).toBe("Bonjour");
  });

  it("tronque et ajoute une ellipse au-delà de la limite", () => {
    expect(truncate("Un texte assez long pour être tronqué", 10)).toBe("Un texte a…");
  });
});

describe("getInitials", () => {
  it("retourne les initiales en majuscules", () => {
    expect(getInitials("marie", "dupont")).toBe("MD");
  });
});
