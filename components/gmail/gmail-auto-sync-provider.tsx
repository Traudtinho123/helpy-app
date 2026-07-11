"use client";

import { useEffect, useRef } from "react";
import {
  markGmailAutoSyncComplete,
  markGmailAutoSyncError,
  markGmailAutoSyncStart,
  markGmailAutoSyncTokenMissing,
} from "@/features/gmail/services/gmail-auto-sync";
import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { syncOutlookVorgaengeIncremental } from "@/features/outlook/services/outlook-vorgaenge-store";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { ensureCompletedVorgaengeLoaded } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";
import { createClient } from "@/lib/supabase/client";

const SYNC_INTERVAL_MS = 30_000;
const INITIAL_SYNC_DELAY_MS = 2_000;

async function resolveUserId(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

async function runGmailAutoSync(): Promise<void> {
  console.log("[HELPY Gmail Auto Sync] Gmail Sync Tick");

  const userId = await resolveUserId();
  await ensureCompletedVorgaengeLoaded(userId);

  markGmailAutoSyncStart();

  try {
    const payload = await syncGmailViaOAuthApi();

    if (!payload.ok && payload.accounts.length === 0) {
      console.log("[HELPY Gmail Auto Sync] Kein Gmail-Konto verbunden");
      markGmailAutoSyncTokenMissing();
      return;
    }

    const result = await syncGmailVorgaengeFromOAuthAccounts(payload.accounts);

    const outlookStatus = await refreshOutlookConnectionStatus();
    if (outlookStatus.status === "connected") {
      await syncOutlookVorgaengeIncremental();
    }

    if (!result.ok && result.newCount === 0) {
      console.log("[HELPY Gmail Auto Sync] Sync fehlgeschlagen:", result.error);
      markGmailAutoSyncError();
      return;
    }

    console.log("[HELPY Gmail Auto Sync] Neue Vorgänge:", result.newCount);

    markGmailAutoSyncComplete({
      newCount: result.newCount,
      newVorgaenge: [],
    });
  } catch (error) {
    console.log("[HELPY Gmail Auto Sync] Sync Fehler:", error);
    markGmailAutoSyncError();
  }
}

export function GmailAutoSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const intervalRef = useRef<number | null>(null);
  const initialTimeoutRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    console.log("[HELPY Gmail Auto Sync] Gmail Auto Sync gestartet");

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      if (runningRef.current) return;
      runningRef.current = true;

      try {
        await runGmailAutoSync();
      } finally {
        runningRef.current = false;
      }
    };

    initialTimeoutRef.current = window.setTimeout(() => {
      void tick();
    }, INITIAL_SYNC_DELAY_MS);

    intervalRef.current = window.setInterval(() => {
      void tick();
    }, SYNC_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      console.log("[HELPY Gmail Auto Sync] Gmail Auto Sync beendet");
      if (initialTimeoutRef.current !== null) {
        window.clearTimeout(initialTimeoutRef.current);
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return children;
}
