import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthStore } from "@/store/authStore";
import { hasRole } from "@/utils/permissions";
import type { Role } from "@/types/user.types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

/**
 * Garde de routage côté UI : évite d'afficher des écrans non pertinents pour
 * l'utilisateur courant. Ce n'est qu'un confort d'expérience — l'autorisation
 * réelle sur les données sera toujours revalidée par le backend.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (allowedRoles && !hasRole(user?.role, allowedRoles)) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  return <>{children}</>;
}
