import { create } from "zustand";
import { persist } from "zustand/middleware";
import { registerAuthHandlers } from "@/api/client/axios";
import type { AuthSession, User } from "@/types/user.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** Le token d'accès reste en mémoire uniquement — jamais persisté en localStorage.
   *  Une future intégration backend le remplacera par un cookie HttpOnly/SameSite. */
  accessToken: string | null;
  setSession: (session: AuthSession) => void;
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

registerAuthHandlers({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().clearSession(),
});
