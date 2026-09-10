import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import { mockUsers } from "@/mocks/users";
import { ApiError } from "@/types/api.types";
import type { AuthSession, User } from "@/types/user.types";
import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schema";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function createMockSession(email: string): AuthSession {
  const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new ApiError({
      message: "Aucun compte ne correspond à cet email.",
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
  }

  return {
    user,
    accessToken: `mock.${btoa(user.id)}.${Date.now()}`,
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  };
}

export const authService = {
  async login(credentials: Pick<LoginFormValues, "email" | "password">): Promise<AuthSession> {
    if (env.useMocks) {
      return mockDelay(createMockSession(credentials.email), 500);
    }
    const { data } = await httpClient.post<AuthSession>("/auth/login", credentials);
    return data;
  },

  async register(payload: Omit<RegisterFormValues, "confirmPassword" | "acceptTerms">): Promise<AuthSession> {
    if (env.useMocks) {
      const newUser = {
        id: `user-${Date.now()}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        role: "customer" as const,
        status: "active" as const,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return mockDelay(
        {
          user: newUser,
          accessToken: `mock.${btoa(newUser.id)}.${Date.now()}`,
          expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        },
        500,
      );
    }
    const { data } = await httpClient.post<AuthSession>("/auth/register", payload);
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (env.useMocks) {
      return mockDelay({ message: `Un email de réinitialisation a été envoyé à ${email}.` }, 500);
    }
    const { data } = await httpClient.post<{ message: string }>("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    if (env.useMocks) {
      void token;
      void password;
      return mockDelay({ message: "Votre mot de passe a été réinitialisé avec succès." }, 500);
    }
    const { data } = await httpClient.post<{ message: string }>("/auth/reset-password", { token, password });
    return data;
  },

  async logout(): Promise<void> {
    if (env.useMocks) {
      await mockDelay(undefined, 150);
      return;
    }
    await httpClient.post("/auth/logout");
  },

  async updateProfile(userId: string, changes: UpdateProfileInput): Promise<User> {
    if (env.useMocks) {
      const user = mockUsers.find((u) => u.id === userId);
      if (!user) {
        throw new ApiError({ message: "Utilisateur introuvable.", code: "USER_NOT_FOUND", status: 404 });
      }
      Object.assign(user, changes);
      return mockDelay(user, 300);
    }
    const { data } = await httpClient.patch<User>("/auth/profile", changes);
    return data;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthSession> {
    if (env.useMocks) {
      void currentPassword;
      void newPassword;
      const user = mockUsers.find((u) => u.id === userId);
      if (!user) {
        throw new ApiError({ message: "Utilisateur introuvable.", code: "USER_NOT_FOUND", status: 404 });
      }
      return mockDelay(
        {
          user,
          accessToken: `mock.${btoa(user.id)}.${Date.now()}`,
          expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        },
        400,
      );
    }
    const { data } = await httpClient.patch<AuthSession>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return data;
  },

  async requestEmailVerification(): Promise<{ message: string }> {
    if (env.useMocks) {
      return mockDelay({ message: "Un email de vérification a été envoyé." }, 400);
    }
    const { data } = await httpClient.post<{ message: string }>("/auth/verify-email/request");
    return data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (env.useMocks) {
      void token;
      return mockDelay({ message: "Votre email a été vérifié avec succès." }, 400);
    }
    const { data } = await httpClient.post<{ message: string }>("/auth/verify-email", { token });
    return data;
  },

  /**
   * Échange le cookie httpOnly de refresh token contre un nouvel access token.
   * Non supporté en mode mock : il n'existe pas de vraie session/cookie à renouveler.
   */
  async refresh(): Promise<AuthSession> {
    if (env.useMocks) {
      throw new ApiError({
        message: "Session expirée.",
        code: "REFRESH_NOT_SUPPORTED_IN_MOCK",
        status: 401,
      });
    }
    const { data } = await httpClient.post<AuthSession>("/auth/refresh");
    return data;
  },
};
