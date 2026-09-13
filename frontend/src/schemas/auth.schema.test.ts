import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schema";

describe("loginSchema", () => {
  it("accepte un email et un mot de passe valides", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "Password1", rememberMe: false }).success,
    ).toBe(true);
  });

  it("rejette un mot de passe trop court", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "short",
      rememberMe: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie@lumera.demo",
    password: "Password1",
    confirmPassword: "Password1",
    acceptTerms: true as const,
  };

  it("accepte une inscription valide", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette si les mots de passe ne correspondent pas", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Autre1234" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejette un mot de passe sans majuscule", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe sans chiffre", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("rejette si les conditions générales ne sont pas acceptées", () => {
    const result = registerSchema.safeParse({ ...valid, acceptTerms: false });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema / changePasswordSchema", () => {
  it("rejette resetPasswordSchema si les mots de passe diffèrent", () => {
    const result = resetPasswordSchema.safeParse({
      token: "tok",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });

  it("accepte changePasswordSchema quand tout correspond", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "ancien",
      newPassword: "Password1",
      confirmNewPassword: "Password1",
    });
    expect(result.success).toBe(true);
  });
});
