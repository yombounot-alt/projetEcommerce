import { CheckCircle2Icon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Seo } from "@/components/common/Seo";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes.constants";
import { useOrderByNumberQuery } from "@/features/orders/api/useOrdersQuery";
import { formatPrice } from "@/utils/format";

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { data: order, isLoading, isError } = useOrderByNumberQuery(orderNumber);

  if (isLoading) return <LoadingState className="min-h-[60vh]" label="Récupération de votre commande…" />;
  if (isError || !order) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Commande introuvable" description="Impossible de retrouver cette commande." />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col items-center py-16 text-center">
      <Seo title="Commande confirmée" noIndex />
      <CheckCircle2Icon className="size-14 text-success" />
      <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground">Merci pour votre commande !</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Un email de confirmation a été envoyé à {order.customerEmail}. Votre commande{" "}
        <span className="font-medium text-foreground">{order.orderNumber}</span> est en cours de traitement.
      </p>

      <Card className="mt-8 w-full max-w-lg text-left">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
            <StatusBadge status={order.status} />
          </div>
          <Separator />
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.productName} × {item.quantity}</span>
              <span className="font-medium text-foreground">{formatPrice(item.subtotal, order.currency)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link to={ROUTES.orders}>Voir mes commandes</Link>
        </Button>
        <Button asChild>
          <Link to={ROUTES.shop}>Continuer mes achats</Link>
        </Button>
      </div>
    </div>
  );
}
