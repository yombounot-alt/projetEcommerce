import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Filet de sécurité global : capture les erreurs de rendu React non gérées
 * pour éviter un écran blanc et proposer une sortie de secours à l'utilisateur.
 * Ne remplace pas la gestion d'erreur locale (TanStack Query, formulaires).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur applicative non gérée :", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-heading text-2xl font-semibold text-foreground">
          Un problème inattendu est survenu
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Nos équipes ont été informées. Vous pouvez recharger la page ou revenir à l'accueil.
        </p>
        <Button onClick={() => window.location.assign("/")}>Retour à l'accueil</Button>
      </div>
    );
  }
}
