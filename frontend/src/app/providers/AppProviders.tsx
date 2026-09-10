import { useEffect } from "react";
import type { ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { refreshAccessToken, useAuthStore } from "@/store/authStore";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // L'access token ne vit qu'en mémoire : après un rechargement de page, un utilisateur
    // marqué authentifié (profil persisté) n'a plus de token tant que cette session n'a pas
    // renouvelé le cookie de refresh — on le fait proactivement plutôt que d'attendre le
    // premier 401 sur un appel authentifié.
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (isAuthenticated && !accessToken) {
      void refreshAccessToken();
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
