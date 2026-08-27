import { BarChart3, LayoutDashboard, Package, Settings, ShoppingBag, Tags, Users } from "lucide-react";

import { ROUTES } from "@/constants/routes.constants";
import type { DashboardNavItem } from "@/layouts/DashboardLayout";

export const adminNavItems: DashboardNavItem[] = [
  { label: "Tableau de bord", to: ROUTES.admin.root, icon: LayoutDashboard },
  { label: "Produits", to: ROUTES.admin.products, icon: Package },
  { label: "Commandes", to: ROUTES.admin.orders, icon: ShoppingBag },
  { label: "Utilisateurs", to: ROUTES.admin.users, icon: Users },
  { label: "Catégories", to: ROUTES.admin.categories, icon: Tags },
  { label: "Paramètres", to: ROUTES.admin.settings, icon: Settings },
];

export const sellerNavItems: DashboardNavItem[] = [
  { label: "Tableau de bord", to: ROUTES.seller.root, icon: LayoutDashboard },
  { label: "Produits", to: ROUTES.seller.products, icon: Package },
  { label: "Commandes", to: ROUTES.seller.orders, icon: ShoppingBag },
  { label: "Clients", to: ROUTES.seller.customers, icon: Users },
  { label: "Analytique", to: ROUTES.seller.analytics, icon: BarChart3 },
];
