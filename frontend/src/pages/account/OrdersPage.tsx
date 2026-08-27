import { PackageIcon } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";
import { useCustomerOrdersQuery } from "@/features/orders/api/useOrdersQuery";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { useAuthStore } from "@/store/authStore";

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const { data: orders, isLoading } = useCustomerOrdersQuery(user?.id);

  return (
    <div className="container-page py-10">
      <Seo title="Mes commandes" canonicalPath={ROUTES.orders} noIndex />
      <PageHeader title="Mes commandes" description="Retrouvez l'historique et le statut de vos commandes." />

      {isLoading && <LoadingState label="Chargement de vos commandes…" />}

      {!isLoading && orders && orders.length === 0 && (
        <EmptyState icon={PackageIcon} title="Aucune commande" description="Vous n'avez pas encore passé de commande." />
      )}

      {!isLoading && orders && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
