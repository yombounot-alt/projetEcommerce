import { Construction } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { EmptyState } from "@/components/common/EmptyState";
import { APP_NAME } from "@/constants/app.constants";

export function SellerComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>{title} — Espace vendeur — {APP_NAME}</title>
      </Helmet>
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <EmptyState
        icon={Construction}
        title="Fonctionnalité à venir"
        description="Cette page nécessite un champ vendeur (sellerId) sur les produits/commandes côté backend pour filtrer les données par vendeur."
      />
    </div>
  );
}
