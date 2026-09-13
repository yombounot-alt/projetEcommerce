import { describe, expect, it } from "vitest";
import {
  customerInfoSchema,
  paymentMethodSchema,
  shippingAddressSchema,
  shippingMethodSchema,
} from "./checkout.schema";

describe("customerInfoSchema", () => {
  const valid = {
    email: "client@lumera.demo",
    firstName: "Marie",
    lastName: "Dupont",
    phone: "+224 600 00 00 00",
  };

  it("accepte des informations valides", () => {
    expect(customerInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = customerInfoSchema.safeParse({ ...valid, email: "pas-un-email" });
    expect(result.success).toBe(false);
  });

  it("rejette un numéro de téléphone avec des lettres", () => {
    const result = customerInfoSchema.safeParse({ ...valid, phone: "abcdefg" });
    expect(result.success).toBe(false);
  });

  it("rejette un prénom trop court", () => {
    const result = customerInfoSchema.safeParse({ ...valid, firstName: "M" });
    expect(result.success).toBe(false);
  });
});

describe("shippingAddressSchema", () => {
  const valid = {
    fullName: "Marie Dupont",
    line1: "1 rue de la Paix",
    city: "Conakry",
    postalCode: "001",
    country: "Guinée",
    phone: "600000000",
    saveAddress: false,
  };

  it("accepte une adresse valide sans champs optionnels", () => {
    expect(shippingAddressSchema.safeParse(valid).success).toBe(true);
  });

  it("accepte line2 et state en plus", () => {
    const result = shippingAddressSchema.safeParse({ ...valid, line2: "Appt 4", state: "Conakry" });
    expect(result.success).toBe(true);
  });

  it("rejette une adresse trop courte", () => {
    const result = shippingAddressSchema.safeParse({ ...valid, line1: "1" });
    expect(result.success).toBe(false);
  });
});

describe("shippingMethodSchema", () => {
  it("accepte 'standard' et 'express'", () => {
    expect(shippingMethodSchema.safeParse({ methodId: "standard" }).success).toBe(true);
    expect(shippingMethodSchema.safeParse({ methodId: "express" }).success).toBe(true);
  });

  it("rejette une méthode inconnue", () => {
    const result = shippingMethodSchema.safeParse({ methodId: "drone" });
    expect(result.success).toBe(false);
  });
});

describe("paymentMethodSchema", () => {
  it("accepte les 4 moyens de paiement supportés", () => {
    for (const method of ["card", "paypal", "bank_transfer", "cash_on_delivery"]) {
      expect(paymentMethodSchema.safeParse({ method, billingSameAsShipping: true }).success).toBe(
        true,
      );
    }
  });

  it("rejette un moyen de paiement non supporté", () => {
    const result = paymentMethodSchema.safeParse({ method: "crypto", billingSameAsShipping: true });
    expect(result.success).toBe(false);
  });
});
