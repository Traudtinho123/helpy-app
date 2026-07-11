"use client";

import { useEffect, useState } from "react";
import { getOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import type { OutlookConnectionState } from "@/features/outlook/types/outlook-types";

export default function DebugOutlookPage() {
  const [status, setStatus] = useState<OutlookConnectionState | null>(null);
  const [mailCount, setMailCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const connection = await refreshOutlookConnectionStatus();
      setStatus(connection);

      if (connection.status === "connected") {
        try {
          const response = await fetch("/api/outlook/mail/sync", {
            method: "POST",
            cache: "no-store",
          });
          const payload = (await response.json()) as
            | { ok: true; messages: unknown[] }
            | { ok: false; error: string };

          if (payload.ok) {
            setMailCount(payload.messages.length);
          } else {
            setSyncError(payload.error);
          }
        } catch (error) {
          setSyncError(
            error instanceof Error
              ? error.message
              : "Outlook-Sync fehlgeschlagen."
          );
        }
      }

      setMailCount((current) =>
        current > 0 ? current : getOutlookVorgaenge().length
      );
      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace" }}>
        Lade Outlook…
      </main>
    );
  }

  const connected = status?.status === "connected";
  const lastError = syncError ?? status?.lastError ?? null;

  return (
    <main style={{ padding: 24, fontFamily: "monospace", lineHeight: 1.8 }}>
      <h1>/debug/outlook</h1>
      <p>Entwickler-Debug — Outlook / Microsoft 365 Connector v1</p>
      <hr />

      <p>Outlook verbunden: {connected ? "Ja" : "Nein"}</p>
      <p>Account E-Mail: {status?.accountEmail ?? "—"}</p>
      <p>Mails geladen: {mailCount}</p>
      <p>Letzter Fehler: {lastError ?? "—"}</p>
    </main>
  );
}
