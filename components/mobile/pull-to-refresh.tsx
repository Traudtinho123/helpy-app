"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { refreshMailVorgaenge } from "@/lib/mobile/gmail-refresh";
import { triggerHapticFeedback } from "@/lib/mobile/haptics";
import { cn } from "@/lib/utils";

type PullToRefreshProps = {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  className?: string;
  disabled?: boolean;
};

const PULL_THRESHOLD = 72;

export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pulling = useRef(false);

  const runRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHapticFeedback(30);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await refreshMailVorgaenge();
      }
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled || refreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    touchStartY.current = event.touches[0]?.clientY ?? 0;
    pulling.current = true;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!pulling.current || disabled || refreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const delta = (event.touches[0]?.clientY ?? 0) - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, 100));
    }
  };

  const handleTouchEnd = () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      void runRefresh();
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={scrollRef}
      className={cn("relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          "pointer-events-none flex items-center justify-center overflow-hidden transition-all duration-200",
          pullDistance > 0 || refreshing ? "opacity-100" : "h-0 opacity-0"
        )}
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        {refreshing ? (
          <Loader2 className="size-5 animate-spin text-[var(--primary)]" />
        ) : (
          <span className="text-[12px] font-medium text-[#64748B]">
            {pullDistance >= PULL_THRESHOLD ? "Loslassen zum Aktualisieren" : "Ziehen zum Aktualisieren"}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
