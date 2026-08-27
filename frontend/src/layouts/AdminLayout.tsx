import { LayoutDashboardIcon, PackageIcon, SettingsIcon, ShoppingCartIcon, TagsIcon, UsersIcon } from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/DashboardSidebar";
import { ROUTES } from "@/constants/routes.constants";
import { DashboardLayout } from "./DashboardLayout";

const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Vue d'ensemble", to: ROUTES.admin.root, icon: LayoutDashboardIcon, end: true },
  { label: "Produits", to: ROUTES.admin.products, icon: PackageIcon },
  { label: "Commandes", to: ROUTES.admin.orders, icon: ShoppingCartIcon },
  { label: "Utilisateurs", to: ROUTES.admin.users, icon: UsersIcon },
  { label: "Catégories", to: ROUTES.admin.categories, icon: TagsIcon },
  { label: "Paramètres", to: ROUTES.admin.settings, icon: SettingsIcon },
];

export function AdminLayout() {
  return <DashboardLayout navItems={ADMIN_NAV_ITEMS} sectionLabel="Administration" />;
}
