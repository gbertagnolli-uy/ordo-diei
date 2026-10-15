"use client";

// Portado de vendor/roost/src/components/showcase/ShowcaseReviews.tsx:22-64 (msrbuilds/roost@492af47).
// Cambios: exportado, tokens de Ordo (text-warning), foco visible, aria-label por estrella, textos en español.

import { useState } from "react";
import { Star } from "lucide-react";

const TAMANOS = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = "md",
}: {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: keyof typeof TAMANOS;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            readonly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"
          }`}
        >
          <Star
            className={`${TAMANOS[size]} ${
              star <= (hoverRating || rating) ? "fill-current text-warning" : "text-muted-foreground/60"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
