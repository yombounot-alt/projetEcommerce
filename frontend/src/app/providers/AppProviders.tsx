import { useEffect } from "react";
import type { ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { refreshAccessTokenOnce } from "@/api/client/axios";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/store/authStore";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // L'access token ne vit qu'en mémoire : après un rechargement de page, un utilisateur
    // marqué authentifié (profil persisté) n'a plus de token tant que cette session n'a pas
    // renouvelé le cookie de refresh — on le fait proactivement plutôt que d'attendre le
    // premier 401 sur un appel authentifié. Passe par refreshAccessTokenOnce (pas
    // authStore#refreshAccessToken directement) pour partager la déduplication avec
    // l'intercepteur 401 : le refresh token étant à usage unique, deux appels concurrents
    // (celui-ci + celui d'un premier 401 sur cart/wishlist) feraient échouer le second.
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (isAuthenticated && !accessToken) {
      void refreshAccessTokenOnce();
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryProvider>
        <ThemeProvider>
          <BrowserRouter>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </BrowserRouter>
        </ThemeProvider>
      </QueryProvider>
    </HelmetProvider>
  );
}
