import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { useCart } from "@/features/cart/api/useCart";
import type { CartItem } from "@/types/order.types";
import { formatPrice } from "@/utils/format";
import { optimizedImageUrl } from "@/utils/image";

export function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4">
      <Link
        to={ROUTES.product(item.slug)}
        className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
      >
        <img
          src={optimizedImageUrl(item.image, 160)}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={ROUTES.product(item.slug)}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {item.name}
            </Link>
            {item.variantLabel && (
              <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.productId, item.variantId)}
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
              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
              aria-label="Diminuer la quantité"
            >
              <MinusIcon className="size-3.5" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
              disabled={item.quantity >= item.stock}
              aria-label="Augmenter la quantité"
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}
