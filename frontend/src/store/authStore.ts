import { create } from "zustand";
import { persist } from "zustand/middleware";
import { registerAuthHandlers } from "@/api/client/axios";
import { authService } from "@/api/services/auth.service";
import type { AuthSession, User } from "@/types/user.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** Le token d'accès reste en mémoire uniquement — jamais persisté en localStorage.
   *  Une future intégration backend le remplacera par un cookie HttpOnly/SameSite. */
  accessToken: string | null;
  setSession: (session: AuthSession) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      setSession: (session) =>
        set({ user: session.user, isAuthenticated: true, accessToken: session.accessToken }),
      updateUser: (user) => set({ user }),
      clearSession: () => set({ user: null, isAuthenticated: false, accessToken: null }),
    }),
    {
      name: "lumera.auth",
      // On ne persiste que le profil utilisateur (non sensible) pour restaurer l'UI
      // après rechargement ; le token doit être ré-émis par une vraie session backend.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);

/**
 * Appelé par le client Axios sur un 401 : tente de renouveler la session via le cookie
 * httpOnly de refresh token (voir /auth/refresh). Nécessaire car l'access token ne vit
 * qu'en mémoire (jamais persisté) — un rechargement de page ou son expiration (15 min)
 * le vide sans ça.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const session = await authService.refresh();
    useAuthStore.getState().setSession(session);
    return session.accessToken;
  } catch {
    useAuthStore.getState().clearSession();
    return null;
  }
}

registerAuthHandlers({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().clearSession(),
  refreshAccessToken,
});
