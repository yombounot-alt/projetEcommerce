import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FREE_SHIPPING_THRESHOLD } from "@/constants/app.constants";
import { formatPrice } from "@/utils/format";

interface CartSummaryProps {
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  children?: ReactNode;
}

export function CartSummary({ subtotal, shippingCost, discount, couponCode, children }: CartSummaryProps) {
  const total = subtotal + shippingCost - discount;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé de la commande</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {remainingForFreeShipping > 0 && (
          <p className="rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
            Plus que {formatPrice(remainingForFreeShipping)} d'achats pour bénéficier de la livraison gratuite.
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Sous-total</span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Livraison</span>
            <span className="text-foreground">{shippingCost === 0 ? "Gratuite" : formatPrice(shippingCost)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Réduction {couponCode && `(${couponCode})`}</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
