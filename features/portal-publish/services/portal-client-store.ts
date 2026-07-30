"use client";

import type {
  ObjektPortalListing,
  PortalConfigStatus,
  PortalDurationDays,
  PortalId,
  PortalObjectSnapshot,
  PortalPublishResult,
} from "@/features/portal-publish/types/portal-publish-types";
import {
  readPersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const LISTINGS_STORAGE = { storageKey: "helpy-portal-listings-v1" };

const listeners = new Set<() => void>();
let cachedListings: ObjektPortalListing[] = [];
let hydrated = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  cachedListings =
    readPersistentJson<ObjektPortalListing[]>(LISTINGS_STORAGE) ?? [];
}

function persist(): void {
  writePersistentJson(LISTINGS_STORAGE, cachedListings);
}

export function subscribePortalListings(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPortalListingSnapshot(
  objektId: string
): ObjektPortalListing | null {
  hydrate();
  return (
    cachedListings.find((item) => item.objekt_id === objektId) ?? null
  );
}

function upsertLocal(listing: ObjektPortalListing): void {
  hydrate();
  const index = cachedListings.findIndex(
    (item) => item.objekt_id === listing.objekt_id
  );
  if (index >= 0) {
    cachedListings[index] = listing;
  } else {
    cachedListings.push(listing);
  }
  persist();
  notify();
}

export async function fetchPortalListing(objektId: string): Promise<{
  listing: ObjektPortalListing | null;
  config: PortalConfigStatus;
}> {
  const response = await fetch(
    `/api/portal-publish?objekt_id=${encodeURIComponent(objektId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return {
      listing: getPortalListingSnapshot(objektId),
      config: { immoscout24: false, homegate: false },
    };
  }

  const data = (await response.json()) as {
    listing?: ObjektPortalListing | null;
    config?: PortalConfigStatus;
  };

  if (data.listing) {
    upsertLocal(data.listing);
  }

  return {
    listing: data.listing ?? getPortalListingSnapshot(objektId),
    config: data.config ?? { immoscout24: false, homegate: false },
  };
}

export async function publishToPortals(input: {
  objektId: string;
  portals: PortalId[];
  durationDays: PortalDurationDays;
  objectSnapshot: PortalObjectSnapshot;
}): Promise<{
  listing: ObjektPortalListing | null;
  results: PortalPublishResult[];
  config: PortalConfigStatus;
  error?: string;
}> {
  const response = await fetch("/api/portal-publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      objekt_id: input.objektId,
      portals: input.portals,
      duration_days: input.durationDays,
      object_snapshot: input.objectSnapshot,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    listing?: ObjektPortalListing;
    results?: PortalPublishResult[];
    config?: PortalConfigStatus;
    error?: string;
  };

  if (!response.ok) {
    return {
      listing: getPortalListingSnapshot(input.objektId),
      results: [],
      config: data.config ?? { immoscout24: false, homegate: false },
      error: data.error ?? "Publizieren fehlgeschlagen.",
    };
  }

  if (data.listing) {
    upsertLocal(data.listing);
  }

  return {
    listing: data.listing ?? null,
    results: data.results ?? [],
    config: data.config ?? { immoscout24: false, homegate: false },
  };
}

export async function refreshPortalStats(objektId: string): Promise<{
  listing: ObjektPortalListing | null;
  config: PortalConfigStatus;
}> {
  const response = await fetch(
    `/api/portal-publish?objekt_id=${encodeURIComponent(objektId)}&refresh_stats=1`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return {
      listing: getPortalListingSnapshot(objektId),
      config: { immoscout24: false, homegate: false },
    };
  }

  const data = (await response.json()) as {
    listing?: ObjektPortalListing | null;
    config?: PortalConfigStatus;
  };

  if (data.listing) {
    upsertLocal(data.listing);
  }

  return {
    listing: data.listing ?? null,
    config: data.config ?? { immoscout24: false, homegate: false },
  };
}

export async function uploadObjektBild(input: {
  objektId: string;
  file: File;
}): Promise<{ url: string | null; error?: string; storage?: string }> {
  const form = new FormData();
  form.set("objekt_id", input.objektId);
  form.set("file", input.file);

  const response = await fetch("/api/portal-publish/images", {
    method: "POST",
    body: form,
  });

  const data = (await response.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
    storage?: string;
  };

  if (!response.ok) {
    return { url: null, error: data.error ?? "Upload fehlgeschlagen." };
  }

  return { url: data.url ?? null, storage: data.storage };
}
