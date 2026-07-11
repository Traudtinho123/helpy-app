"use client";

import type { WhatsappSummary } from "@/features/whatsapp/types/whatsapp-types";

const EMPTY_SUMMARY: WhatsappSummary = {
  openCount: 0,
  neuCount: 0,
  inBearbeitungCount: 0,
  erledigtCount: 0,
  archiviertCount: 0,
  todayCount: 0,
  weekCount: 0,
  connected: false,
  displayNumber: null,
};

type Listener = () => void;

let summary: WhatsappSummary = EMPTY_SUMMARY;
const listeners = new Set<Listener>();
let pollTimer: ReturnType<typeof setInterval> | null = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getWhatsappSummarySnapshot(): WhatsappSummary {
  return summary;
}

export function getStableWhatsappOpenCountSnapshot(): number {
  return summary.openCount;
}

export function subscribeWhatsappSummary(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function refreshWhatsappSummary(): Promise<WhatsappSummary> {
  try {
    const response = await fetch("/api/whatsapp/summary", {
      cache: "no-store",
    });
    if (!response.ok) return summary;

    const payload = (await response.json()) as WhatsappSummary;
    summary = payload;
    notify();
    return summary;
  } catch {
    return summary;
  }
}

export function startWhatsappSummaryPolling(intervalMs = 30_000): () => void {
  if (pollTimer) return () => stopWhatsappSummaryPolling();

  void refreshWhatsappSummary();
  pollTimer = setInterval(() => {
    void refreshWhatsappSummary();
  }, intervalMs);

  return () => stopWhatsappSummaryPolling();
}

export function stopWhatsappSummaryPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
