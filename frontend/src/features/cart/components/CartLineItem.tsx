import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/types/order.types";

export function CartLineItem({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex gap-4 py-4">
      <Link to={ROUTES.product(item.slug)} className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
        <img src={item.image} alt={item.name} className="size-full object-cover" />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={ROUTES.product(item.slug)} className="text-sm font-medium text-foreground hover:underline">
            {item.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.productId)}
            aria-label="Retirer du panier"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>

        <PriceDisplay price={item.price} compareAtPrice={item.compareAtPrice} size="sm" />

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-md border border-input">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label="Diminuer la quantité"
            >
              <MinusIcon className="size-3.5" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              aria-label="Augmenter la quantité"
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {(item.price * item.quantity).toFixed(2)} €
          </p>
        </div>
      </div>
    </div>
  );
}
