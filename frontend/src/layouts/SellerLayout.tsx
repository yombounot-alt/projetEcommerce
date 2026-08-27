import { BarChart3Icon, LayoutDashboardIcon, PackageIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/DashboardSidebar";
import { ROUTES } from "@/constants/routes.constants";
import { DashboardLayout } from "./DashboardLayout";

const SELLER_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Vue d'ensemble", to: ROUTES.seller.root, icon: LayoutDashboardIcon, end: true },
  { label: "Produits", to: ROUTES.seller.products, icon: PackageIcon },
  { label: "Commandes", to: ROUTES.seller.orders, icon: ShoppingCartIcon },
  { label: "Clients", to: ROUTES.seller.customers, icon: UsersIcon },
  { label: "Analytique", to: ROUTES.seller.analytics, icon: BarChart3Icon },
];

export function SellerLayout() {
  return <DashboardLayout navItems={SELLER_NAV_ITEMS} sectionLabel="Espace vendeur" />;
}
