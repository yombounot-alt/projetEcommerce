import type { Role } from "@/types/user.types";

/**
 * Permissions purement déclaratives côté UI (affichage conditionnel de menus/actions).
 * Elles ne constituent jamais une frontière de sécurité : toute opération sensible
 * doit être revalidée par le backend, seul juge de l'autorisation réelle.
 */
export const ROLE_HOME_ROUTE: Record<Role, string> = {
  admin: "/admin",
  seller: "/seller",
  customer: "/",
};

export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

export function canAccessAdmin(role?: Role): boolean {
  return hasRole(role, ["admin"]);
}

export function canAccessSeller(role?: Role): boolean {
  return hasRole(role, ["admin", "seller"]);
}
