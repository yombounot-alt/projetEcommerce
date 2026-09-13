import { useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { optimizedImageUrl } from "@/utils/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<{ backgroundPosition: string } | null>(null);
  const activeImage = images[activeIndex] ?? images[0];

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ backgroundPosition: `${x}% ${y}%` });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <div
        className="relative aspect-square flex-1 overflow-hidden rounded-xl border border-border bg-muted"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomStyle(null)}
      >
        <img
          src={optimizedImageUrl(activeImage, 900)}
          alt={productName}
          decoding="async"
          fetchPriority="high"
          className="size-full object-cover"
          style={
            zoomStyle
              ? {
                  transform: "scale(1.8)",
                  transformOrigin: zoomStyle.backgroundPosition,
                  transition: "transform 0.05s",
                }
              : { transition: "transform 0.2s" }
          }
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:size-20",
                index === activeIndex ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              <img
                src={optimizedImageUrl(image, 160)}
                alt={`${productName} vue ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
