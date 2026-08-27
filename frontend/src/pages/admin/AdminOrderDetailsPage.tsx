import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Seo } from "@/components/common/Seo";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes.constants";
import { useOrderQuery } from "@/features/orders/api/useOrdersQuery";
import { useUpdateOrderStatusMutation } from "@/features/orders/api/useOrderMutations";
import { ORDER_STATUS_OPTIONS } from "@/utils/order";
import { formatDate, formatPrice } from "@/utils/format";
import type { OrderStatus } from "@/types/order.types";

export default function AdminOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrderQuery(id);
  const updateStatus = useUpdateOrderStatusMutation();

  if (isLoading) return <LoadingState className="min-h-[50vh]" label="Chargement de la commande…" />;
  if (isError || !order) {
    return <ErrorState title="Commande introuvable" onRetry={() => refetch()} />;
  }

  function handleStatusChange(status: string) {
    if (!order) return;
    updateStatus.mutate(
      { id: order.id, status: status as OrderStatus },
      { onSuccess: () => toast.success("Statut de la commande mis à jour.") },
    );
  }

  return (
    <div className="space-y-6">
      <Seo title={`Commande ${order.orderNumber}`} noIndex />
      <Breadcrumb items={[{ label: "Commandes", to: ROUTES.admin.orders }, { label: order.orderNumber }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Commande {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Passée le {formatDate(order.createdAt)}</p>
        </div>
        <Select value={order.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <p className="text-xs text-muted-foreground">SKU {item.sku} · Qté {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatPrice(item.subtotal, order.currency)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Client</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Paiement</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Méthode</span><span className="text-foreground">{order.payment.method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><StatusBadge status={order.status} /></div>
              <Separator />
              <div className="flex justify-between font-semibold text-foreground"><span>Total</span><span>{formatPrice(order.total, order.currency)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Adresse de livraison</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.country}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
