"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_BATCH_SIZE = 30;

type VorgaengeIncrementalListProps<T> = {
  items: T[];
  batchSize?: number;
  resetKey: string;
  className?: string;
  renderItem: (item: T, index: number) => ReactNode;
};

export function VorgaengeIncrementalList<T>({
  items,
  batchSize = DEFAULT_BATCH_SIZE,
  resetKey,
  className,
  renderItem,
}: VorgaengeIncrementalListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, resetKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((current) =>
          Math.min(current + batchSize, items.length)
        );
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [batchSize, items.length, visibleCount]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className={cn("space-y-3", className)}>
      {visibleItems.map((item, index) => renderItem(item, index))}

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-center text-[12px] text-[var(--text-muted)]"
        >
          Weitere Vorgänge werden geladen…
        </div>
      ) : null}
    </div>
  );
}
