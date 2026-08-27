import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROLE_HOME_ROUTE } from "@/utils/permissions";

/** Empêche un utilisateur déjà connecté de revoir les pages login/register. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME_ROUTE[user.role]} replace />;
  }

  return <>{children}</>;
}
