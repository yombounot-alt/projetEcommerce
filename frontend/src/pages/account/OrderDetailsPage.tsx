import { useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Seo } from "@/components/common/Seo";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes.constants";
import { useOrderQuery } from "@/features/orders/api/useOrdersQuery";
import { formatDate, formatPrice } from "@/utils/format";

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrderQuery(id);

  if (isLoading) return <LoadingState className="min-h-[50vh]" label="Chargement de la commande…" />;
  if (isError || !order) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Commande introuvable" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Seo title={`Commande ${order.orderNumber}`} noIndex />
      <Breadcrumb items={[{ label: "Mes commandes", to: ROUTES.orders }, { label: order.orderNumber }]} />

      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Commande {order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3">
                <img src={item.productImage} alt={item.productName} className="size-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qté {item.quantity} · {formatPrice(item.unitPrice)}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatPrice(item.subtotal, order.currency)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Résumé</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span><span className="text-foreground">{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Livraison</span><span className="text-foreground">{formatPrice(order.shippingCost, order.currency)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Réduction</span><span>-{formatPrice(order.discount, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span><span>{formatPrice(order.total, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Livraison</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2 text-xs">Commande passée le {formatDate(order.createdAt)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
