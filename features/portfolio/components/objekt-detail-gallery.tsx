"use client";

import { useMemo, useState } from "react";
import { Building2, Images } from "lucide-react";
import { sortObjectImages } from "@/features/real-estate/object/object-image-service";
import type { ObjectImage } from "@/features/real-estate/object/object-image-types";
import { cn } from "@/lib/utils";

type ObjektDetailGalleryProps = {
  images: ObjectImage[];
  title: string;
};

export function ObjektDetailGallery({ images, title }: ObjektDetailGalleryProps) {
  const confirmed = useMemo(
    () => sortObjectImages(images.filter((image) => image.status === "bestätigt")),
    [images]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = confirmed.length > 0 ? Math.min(activeIndex, confirmed.length - 1) : 0;
  const hero = confirmed[safeIndex];
  const thumbs = confirmed.slice(0, 4);
  const remaining = confirmed.length - thumbs.length;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="relative aspect-video bg-[var(--bg-elevated)]">
        {hero?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.url} alt={title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <Building2 className="size-12 opacity-40" />
            <span className="text-[12px]">Noch kein Titelbild</span>
          </div>
        )}
      </div>

      {thumbs.length > 0 ? (
        <div className="flex gap-2 border-t border-[var(--border)] p-3">
          {thumbs.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                safeIndex === index
                  ? "border-[var(--accent)]"
                  : "border-transparent hover:border-[var(--border-strong)]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.fileName}
                className="size-full object-cover"
              />
            </button>
          ))}
          {remaining > 0 ? (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] font-semibold text-[var(--text-muted)]">
              +{remaining}
            </div>
          ) : null}
          {confirmed.length > 1 ? (
            <button
              type="button"
              className="ml-auto flex items-center gap-1.5 self-center rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-accent)] hover:bg-[var(--accent-light)]"
            >
              <Images className="size-3.5" />
              Alle Bilder ({confirmed.length})
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
