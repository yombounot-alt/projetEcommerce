import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export function StarRating({ rating, size = 16, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          width={size}
          height={size}
          className={index < Math.round(rating) ? "fill-accent text-accent" : "fill-transparent text-border"}
        />
      ))}
    </div>
  );
}
