import { ArrowRightIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { STANDARD_SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/constants/app.constants";
import { CartLineItem } from "@/features/cart/components/CartLineItem";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { CouponForm } from "@/features/cart/components/CouponForm";
import { selectCartSubtotal, useCartStore } from "@/store/cartStore";
import type { Coupon } from "@/types/order.types";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const subtotal = useCartStore(selectCartSubtotal);
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const shippingCost = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const discount = coupon
    ? coupon.type === "percentage"
      ? Number((subtotal * (coupon.value / 100)).toFixed(2))
      : coupon.value
    : 0;

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <Seo title="Panier" canonicalPath={ROUTES.cart} />
        <EmptyState
          icon={ShoppingBagIcon}
          title="Votre panier est vide"
          description="Parcourez notre catalogue et ajoutez des produits pour commencer votre commande."
          action={
            <Button asChild>
              <Link to={ROUTES.shop}>Découvrir la boutique</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Seo title="Panier" canonicalPath={ROUTES.cart} noIndex />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Mon panier</h1>
        <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
          <Trash2Icon className="size-4" /> Vider le panier
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="divide-y divide-border rounded-xl border border-border px-4 sm:px-6">
          {items.map((item) => (
            <CartLineItem key={item.productId} item={item} />
          ))}
        </div>

        <div className="space-y-4">
          <CartSummary subtotal={subtotal} shippingCost={shippingCost} discount={discount} couponCode={coupon?.code}>
            <Button size="lg" className="w-full" onClick={() => navigate(ROUTES.checkout)}>
              Passer commande <ArrowRightIcon />
            </Button>
          </CartSummary>
          <CouponForm subtotal={subtotal} appliedCoupon={coupon} onApplied={setCoupon} />
        </div>
      </div>
    </div>
  );
}
