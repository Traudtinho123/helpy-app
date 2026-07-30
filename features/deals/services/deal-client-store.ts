"use client";

import type { DealWithRelations } from "@/features/deals/types/deal-types";

let cachedDeals: DealWithRelations[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDeals(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCachedDeals(): DealWithRelations[] {
  return cachedDeals.map((deal) => ({ ...deal }));
}

export async function fetchDeals(filters?: {
  objekt_id?: string;
  openOnly?: boolean;
}): Promise<DealWithRelations[]> {
  const params = new URLSearchParams();
  if (filters?.objekt_id) params.set("objekt_id", filters.objekt_id);
  if (filters?.openOnly) params.set("open_only", "1");

  const response = await fetch(
    `/api/deals${params.size ? `?${params.toString()}` : ""}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return getCachedDeals();
  }

  const data = (await response.json()) as { deals?: DealWithRelations[] };
  cachedDeals = data.deals ?? [];
  notify();
  return getCachedDeals();
}

export async function moveDealToPhase(input: {
  dealId: string;
  phase: number;
  beschreibung?: string;
}): Promise<DealWithRelations | null> {
  const response = await fetch(`/api/deals/${input.dealId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phase: input.phase,
      beschreibung: input.beschreibung,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { deal?: DealWithRelations };
  if (data.deal) {
    cachedDeals = cachedDeals.map((deal) =>
      deal.id === data.deal!.id ? data.deal! : deal
    );
    notify();
  }
  await fetchDeals();
  return data.deal ?? null;
}

export async function createDealFromVorgang(input: {
  vorgangId: string;
  objektId: string;
  kundeId?: string | null;
  dealType?: "verkauf" | "vermietung";
  provisionChf?: number | null;
}): Promise<DealWithRelations | null> {
  const response = await fetch("/api/deals/from-vorgang", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { deal?: DealWithRelations };
  await fetchDeals();
  return data.deal ?? null;
}

export function getOpenDealCountSnapshot(): number {
  return cachedDeals.filter((deal) => deal.phase < 9).length;
}

export type DealNotification = {
  id: string;
  title: string;
  createdAt: string;
};

const notificationListeners = new Set<() => void>();
let notifications: DealNotification[] = [];

export function subscribeDealNotifications(listener: () => void): () => void {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
}

export function pushDealNotification(title: string): void {
  notifications = [
    { id: `deal-notif-${Date.now()}`, title, createdAt: new Date().toISOString() },
    ...notifications,
  ].slice(0, 20);
  notificationListeners.forEach((listener) => listener());

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("HELPY Pipeline", { body: title });
    }
  }
}

export function getDealNotifications(): DealNotification[] {
  return [...notifications];
}
