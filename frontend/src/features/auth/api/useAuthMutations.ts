import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, type UpdateProfileInput } from "@/api/services/auth.service";
import { cartService } from "@/api/services/cart.service";
import { wishlistService } from "@/api/services/wishlist.service";
import { queryKeys } from "@/api/query-keys";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schema";
import type { AuthSession } from "@/types/user.types";

/**
 * Le panier et les favoris invités (locaux, non authentifiés) sont perdus au profit des
 * versions serveur dès qu'un client se connecte — on les fusionne donc avant de les vider,
 * pour ne pas faire disparaître silencieusement ce qui a été ajouté avant connexion.
 */
async function mergeGuestStateIntoServer(session: AuthSession) {
  if (session.user.role !== "customer") return;

  const guestCartItems = useCartStore.getState().items;
  if (guestCartItems.length > 0) {
    await Promise.all(
      guestCartItems.map((item) =>
        cartService.addItem(item.productId, item.quantity, item.variantId),
      ),
    );
    useCartStore.getState().clear();
  }

  const guestWishlistItems = useWishlistStore.getState().items;
  if (guestWishlistItems.length > 0) {
    await Promise.all(guestWishlistItems.map((item) => wishlistService.add(item.id)));
    useWishlistStore.getState().clear();
  }
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: Pick<LoginFormValues, "email" | "password">) =>
      authService.login(credentials),
    onSuccess: async (session) => {
      useAuthStore.getState().setSession(session);
      await mergeGuestStateIntoServer(session);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<RegisterFormValues, "confirmPassword" | "acceptTerms">) =>
      authService.register(payload),
    onSuccess: async (session) => {
      useAuthStore.getState().setSession(session);
      await mergeGuestStateIntoServer(session);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
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

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (changes: UpdateProfileInput) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error("Aucun utilisateur connecté.");
      return authService.updateProfile(userId, changes);
    },
    onSuccess: (user) => {
      useAuthStore.getState().updateUser(user);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error("Aucun utilisateur connecté.");
      return authService.changePassword(userId, currentPassword, newPassword);
    },
    onSuccess: (session) => {
      useAuthStore.getState().setSession(session);
    },
  });
}

export function useRequestEmailVerificationMutation() {
  return useMutation({
    mutationFn: () => authService.requestEmailVerification(),
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      const user = useAuthStore.getState().user;
      if (user) useAuthStore.getState().updateUser({ ...user, isVerified: true });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      useAuthStore.getState().clearSession();
      queryClient.removeQueries({ queryKey: queryKeys.cart.all });
      queryClient.removeQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}
