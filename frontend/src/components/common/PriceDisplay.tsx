import { computeDiscountPercentage, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export function PriceDisplay({ price, compareAtPrice, currency, size = "md", className }: PriceDisplayProps) {
  const discount = computeDiscountPercentage(price, compareAtPrice);

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-foreground", sizeClasses[size])}>
        {formatPrice(price, currency)}
      </span>
      {compareAtPrice && discount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(compareAtPrice, currency)}
          </span>
          <span className="text-xs font-semibold text-destructive">-{discount}%</span>
        </>
      )}
    </div>
  );
}
