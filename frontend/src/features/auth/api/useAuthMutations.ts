import { useMutation } from "@tanstack/react-query";
import { authService } from "@/api/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schema";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: Pick<LoginFormValues, "email" | "password">) => authService.login(credentials),
    onSuccess: (session) => {
      useAuthStore.getState().setSession(session);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: Omit<RegisterFormValues, "confirmPassword" | "acceptTerms">) =>
      authService.register(payload),
    onSuccess: (session) => {
      useAuthStore.getState().setSession(session);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      useAuthStore.getState().clearSession();
    },
  });
}
