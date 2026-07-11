import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

let lastSyncSignature: string | null = null;
let syncInFlight: Promise<void> | null = null;

function buildSyncSignature(vorgaenge: Vorgang[]): string {
  return vorgaenge
    .map((item) => `${item.id}:${item.latestMessageAt ?? item.receivedAt ?? ""}`)
    .sort()
    .join("|");
}

export async function syncVorgangEventsForAnalytics(
  vorgaenge: Vorgang[]
): Promise<void> {
  if (vorgaenge.length === 0) return;

  const signature = buildSyncSignature(vorgaenge);
  if (signature === lastSyncSignature) return;

  if (syncInFlight) {
    await syncInFlight;
    if (signature === lastSyncSignature) return;
  }

  syncInFlight = (async () => {
    try {
      const response = await fetch("/api/dashboard/vorgang-events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vorgaenge }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        console.warn(
          "[HELPY Analytics] Vorgang-Events Sync fehlgeschlagen:",
          payload.error ?? response.status
        );
        return;
      }

      lastSyncSignature = signature;
    } catch (error) {
      console.warn("[HELPY Analytics] Vorgang-Events Sync exception:", error);
    } finally {
      syncInFlight = null;
    }
  })();

  await syncInFlight;
}

/** Nur für Tests. */
export function resetVorgangEventsAnalyticsSyncForTests(): void {
  lastSyncSignature = null;
  syncInFlight = null;
}

export async function fetchWorkdayAnalytics(): Promise<
  | { ok: true; data: import("@/features/analytics/services/workday-analytics").WorkdayAnalytics }
  | { ok: false; error: string }
> {
  try {
    const response = await fetch("/api/dashboard/workday-analytics", {
      credentials: "include",
      cache: "no-store",
    });
    const payload = (await response.json()) as
      | import("@/features/analytics/services/workday-analytics").WorkdayAnalytics
      | { error?: string };

    if (!response.ok) {
      return {
        ok: false,
        error:
          (payload as { error?: string }).error ??
          "Analytics konnten nicht geladen werden.",
      };
    }

    return {
      ok: true,
      data: payload as import("@/features/analytics/services/workday-analytics").WorkdayAnalytics,
    };
  } catch {
    return {
      ok: false,
      error: "Verbindung zum Server fehlgeschlagen.",
    };
  }
}
