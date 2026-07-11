"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatGmailSyncStatusLabel,
  getGmailAutoSyncServerSnapshot,
  getGmailAutoSyncState,
  subscribeGmailAutoSync,
} from "@/features/gmail/services/gmail-auto-sync";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

export function GmailSyncStatus() {
  const syncState = useExternalStore(
    subscribeGmailAutoSync,
    getGmailAutoSyncState,
    getGmailAutoSyncServerSnapshot
  );
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (syncState.status !== "synced" || !syncState.lastSyncedAt) return;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [syncState.lastSyncedAt, syncState.status]);

  const label = formatGmailSyncStatusLabel(
    syncState,
    now ?? syncState.lastSyncedAt ?? 0
  );
  const isSyncing = syncState.status === "syncing";

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-8 gap-1.5 rounded-full px-3 text-[11px] font-medium",
        isSyncing
          ? "border-[#BFDBFE]/70 bg-[#EFF6FF]/80 text-[#2563EB]"
          : "border-[#A7F3D0]/70 bg-[#ECFDF5]/80 text-[#047857]"
      )}
    >
      {isSyncing && <Loader2 className="size-3 animate-spin" strokeWidth={2.5} />}
      {label}
    </Badge>
  );
}
