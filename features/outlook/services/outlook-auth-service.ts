"use client";

import type { OutlookConnectionState } from "@/features/outlook/types/outlook-types";

const STATUS_CACHE_KEY = "helpy-outlook-connection-cache-v1";

let cachedStatus: OutlookConnectionState = createDisconnectedState();
const listeners = new Set<() => void>();

function createDisconnectedState(): OutlookConnectionState {
  return {
    status: "disconnected",
    accountEmail: null,
    connectedAt: null,
    lastSyncAt: null,
    lastError: null,
    messagesToday: 0,
    hasAccessToken: false,
    hasRefreshToken: false,
  };
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeOutlookConnection(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOutlookConnectionState(): OutlookConnectionState {
  return { ...cachedStatus };
}

export function getOutlookConnectionServerSnapshot(): OutlookConnectionState {
  return createDisconnectedState();
}

function persistStatusCache(state: OutlookConnectionState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(state));
}

function hydrateStatusCache(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STATUS_CACHE_KEY);
    if (!raw) return;
    cachedStatus = JSON.parse(raw) as OutlookConnectionState;
  } catch {
    cachedStatus = createDisconnectedState();
  }
}

export async function refreshOutlookConnectionStatus(): Promise<OutlookConnectionState> {
  hydrateStatusCache();

  try {
    const response = await fetch("/api/outlook/auth/status", {
      cache: "no-store",
    });
    const payload = (await response.json()) as OutlookConnectionState;
    cachedStatus = payload;
    persistStatusCache(payload);
    notify();
    return payload;
  } catch (error) {
    cachedStatus = {
      ...cachedStatus,
      status: "error",
      lastError:
        error instanceof Error
          ? error.message
          : "Outlook-Verbindung konnte nicht geprüft werden.",
    };
    notify();
    return cachedStatus;
  }
}

export function startOutlookConnect(): void {
  window.location.href = "/api/oauth/microsoft/start";
}

export async function disconnectOutlookConnection(): Promise<void> {
  await fetch("/api/outlook/auth/disconnect", { method: "POST" });
  cachedStatus = createDisconnectedState();
  persistStatusCache(cachedStatus);
  notify();
}

export function connectOutlookIntegrationFromStatus(
  state: OutlookConnectionState
): void {
  cachedStatus = state;
  persistStatusCache(state);
  notify();
}

hydrateStatusCache();
