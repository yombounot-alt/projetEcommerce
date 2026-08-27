import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes.constants";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS } from "@/utils/order";
import { formatDate, formatPrice } from "@/utils/format";
import type { Order } from "@/types/order.types";

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      to={ROUTES.orderDetails(order.id)}
      className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 transition-colors hover:border-foreground/30"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">Commande {order.orderNumber}</p>
          <Badge variant={ORDER_STATUS_VARIANTS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(order.createdAt)} · {order.items.length} article(s)
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="font-heading text-base font-semibold text-foreground">
          {formatPrice(order.total, order.currency)}
        </p>
        <ChevronRightIcon className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
