"use client";

import type {
  CreateSuchprofilInput,
  ExtractedSuchprofil,
  ObjektMatchWithKunde,
  SuchprofilRecord,
  UpdateSuchprofilInput,
} from "@/features/matching/types/matching-types";
import { MATCH_THRESHOLD } from "@/features/matching/types/matching-types";
import { buildMatchRecordsForObject } from "@/features/matching/services/match-orchestrator";
import type { KundeContactInfo } from "@/features/matching/services/match-orchestrator";
import { pushNotification } from "@/features/notifications/services/notification-store";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  readPersistentJson,
  writePersistentJson,
} from "@/lib/store/persistent-client-storage";

const SUCHPROFILE_STORAGE = { storageKey: "helpy-suchprofile-v1" };
const MATCHES_STORAGE = { storageKey: "helpy-objekt-matches-v1" };
const PENDING_EXTRACTIONS_STORAGE = { storageKey: "helpy-suchprofil-pending-v1" };

const listeners = new Set<() => void>();

let cachedSuchprofile: SuchprofilRecord[] = [];
let cachedMatches: ObjektMatchWithKunde[] = [];
let hydrated = false;

export type PendingSuchprofilExtraction = {
  id: string;
  kunde_id: string;
  vorgangId?: string;
  extracted: ExtractedSuchprofil;
  createdAt: string;
};

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  cachedSuchprofile =
    readPersistentJson<SuchprofilRecord[]>(SUCHPROFILE_STORAGE) ?? [];
  cachedMatches =
    readPersistentJson<ObjektMatchWithKunde[]>(MATCHES_STORAGE) ?? [];
}

function persistSuchprofile(): void {
  writePersistentJson(SUCHPROFILE_STORAGE, cachedSuchprofile);
}

function persistMatches(): void {
  writePersistentJson(MATCHES_STORAGE, cachedMatches);
}

export function subscribeMatchingStore(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSuchprofileSnapshot(): SuchprofilRecord[] {
  hydrate();
  return cachedSuchprofile.map((item) => ({ ...item }));
}

export function getSuchprofilForKunde(kundeId: string): SuchprofilRecord | null {
  hydrate();
  return (
    cachedSuchprofile.find(
      (item) => item.kunde_id === kundeId && item.aktiv
    ) ??
    cachedSuchprofile.find((item) => item.kunde_id === kundeId) ??
    null
  );
}

export function getMatchesSnapshot(): ObjektMatchWithKunde[] {
  hydrate();
  return cachedMatches.map((item) => ({ ...item }));
}

export function getMatchesForObject(objectId: string): ObjektMatchWithKunde[] {
  hydrate();
  return cachedMatches
    .filter((item) => item.objekt_id === objectId)
    .sort((a, b) => b.score - a.score);
}

export function getTodayMatches(): ObjektMatchWithKunde[] {
  hydrate();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return cachedMatches.filter(
    (item) => new Date(item.created_at) >= start && item.score >= MATCH_THRESHOLD
  );
}

export async function fetchSuchprofile(filters?: {
  kunde_id?: string;
}): Promise<SuchprofilRecord[]> {
  hydrate();
  const params = new URLSearchParams();
  if (filters?.kunde_id) params.set("kunde_id", filters.kunde_id);

  try {
    const response = await fetch(
      `/api/suchprofile${params.size ? `?${params.toString()}` : ""}`,
      { cache: "no-store" }
    );
    if (response.ok) {
      const data = (await response.json()) as {
        suchprofile?: SuchprofilRecord[];
      };
      if (data.suchprofile?.length) {
        const ids = new Set(data.suchprofile.map((item) => item.id));
        cachedSuchprofile = [
          ...data.suchprofile,
          ...cachedSuchprofile.filter((item) => !ids.has(item.id)),
        ];
        persistSuchprofile();
        notify();
      }
    }
  } catch {
    // localStorage fallback bleibt aktiv
  }

  return getSuchprofileSnapshot();
}

export async function fetchMatches(filters?: {
  objekt_id?: string;
  today?: boolean;
}): Promise<ObjektMatchWithKunde[]> {
  hydrate();
  const params = new URLSearchParams();
  if (filters?.objekt_id) params.set("objekt_id", filters.objekt_id);
  if (filters?.today) params.set("today", "1");

  try {
    const response = await fetch(
      `/api/matches${params.size ? `?${params.toString()}` : ""}`,
      { cache: "no-store" }
    );
    if (response.ok) {
      const data = (await response.json()) as { matches?: ObjektMatchWithKunde[] };
      if (data.matches?.length) {
        const ids = new Set(data.matches.map((item) => item.id));
        cachedMatches = [
          ...data.matches,
          ...cachedMatches.filter((item) => !ids.has(item.id)),
        ];
        persistMatches();
        notify();
      }
    }
  } catch {
    // localStorage fallback
  }

  return getMatchesSnapshot();
}

export async function saveSuchprofil(
  input: CreateSuchprofilInput & { id?: string }
): Promise<SuchprofilRecord | null> {
  hydrate();
  const now = new Date().toISOString();

  if (input.id) {
    const existing = cachedSuchprofile.find((item) => item.id === input.id);
    if (existing) {
      const updated: SuchprofilRecord = {
        ...existing,
        ...input,
        updated_at: now,
      };
      cachedSuchprofile = cachedSuchprofile.map((item) =>
        item.id === input.id ? updated : item
      );
      persistSuchprofile();
      notify();

      try {
        await fetch(`/api/suchprofile/${input.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input satisfies UpdateSuchprofilInput),
        });
      } catch {
        // localStorage bleibt Quelle der Wahrheit
      }
      return updated;
    }
  }

  const localRecord: SuchprofilRecord = {
    id: input.id ?? `local-suchprofil-${Date.now()}`,
    company_id: "local",
    kunde_id: input.kunde_id,
    art: input.art ?? "mieten",
    objekttyp: input.objekttyp ?? [],
    zimmer_min: input.zimmer_min ?? null,
    zimmer_max: input.zimmer_max ?? null,
    flaeche_min: input.flaeche_min ?? null,
    flaeche_max: input.flaeche_max ?? null,
    preis_max: input.preis_max ?? null,
    lagen: input.lagen ?? [],
    muss_kriterien: input.muss_kriterien ?? [],
    notizen: input.notizen ?? null,
    aktiv: input.aktiv ?? true,
    auto_erkannt: input.auto_erkannt ?? false,
    created_at: now,
    updated_at: now,
  };

  cachedSuchprofile = [
    localRecord,
    ...cachedSuchprofile.filter((item) => item.kunde_id !== input.kunde_id),
  ];
  persistSuchprofile();
  notify();

  try {
    const response = await fetch("/api/suchprofile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (response.ok) {
      const data = (await response.json()) as { suchprofil?: SuchprofilRecord };
      if (data.suchprofil) {
        cachedSuchprofile = [
          data.suchprofil,
          ...cachedSuchprofile.filter(
            (item) =>
              item.id !== localRecord.id &&
              item.kunde_id !== data.suchprofil!.kunde_id
          ),
        ];
        persistSuchprofile();
        notify();
        return data.suchprofil;
      }
    }
  } catch {
    // local record bleibt
  }

  return localRecord;
}

export function queueSuchprofilExtraction(input: {
  kunde_id: string;
  vorgangId?: string;
  extracted: ExtractedSuchprofil;
}): PendingSuchprofilExtraction {
  const pending: PendingSuchprofilExtraction = {
    id: `pending-${Date.now()}`,
    kunde_id: input.kunde_id,
    vorgangId: input.vorgangId,
    extracted: input.extracted,
    createdAt: new Date().toISOString(),
  };

  const existing =
    readPersistentJson<PendingSuchprofilExtraction[]>(PENDING_EXTRACTIONS_STORAGE) ??
    [];
  writePersistentJson(PENDING_EXTRACTIONS_STORAGE, [pending, ...existing].slice(0, 20));
  notify();
  return pending;
}

export function getPendingExtractionsForKunde(
  kundeId: string
): PendingSuchprofilExtraction | null {
  const existing =
    readPersistentJson<PendingSuchprofilExtraction[]>(PENDING_EXTRACTIONS_STORAGE) ??
    [];
  return existing.find((item) => item.kunde_id === kundeId) ?? null;
}

export function dismissPendingExtraction(id: string): void {
  const existing =
    readPersistentJson<PendingSuchprofilExtraction[]>(PENDING_EXTRACTIONS_STORAGE) ??
    [];
  writePersistentJson(
    PENDING_EXTRACTIONS_STORAGE,
    existing.filter((item) => item.id !== id)
  );
  notify();
}

export type ObjectMatchResult = {
  objectId: string;
  objectTitle: string;
  matches: ObjektMatchWithKunde[];
};

export function runMatchingForObject(
  object: RealEstateObject,
  kundeNames?: Map<string, KundeContactInfo>
): ObjectMatchResult {
  hydrate();

  const existingKeys = new Set(
    cachedMatches.map(
      (item) => `${item.objekt_id}:${item.kunde_id}:${item.suchprofil_id}`
    )
  );

  const newMatches = buildMatchRecordsForObject(
    object,
    cachedSuchprofile,
    kundeNames,
    existingKeys
  );

  if (newMatches.length) {
    cachedMatches = [...newMatches, ...cachedMatches];
    persistMatches();
    notify();

    pushMatchNotification(object, newMatches);

    void fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objekt_id: object.objectId,
        matches: newMatches.map((item) => ({
          kunde_id: item.kunde_id,
          suchprofil_id: item.suchprofil_id,
          score: item.score,
          score_details: item.score_details,
        })),
      }),
    }).catch(() => undefined);
  }

  return {
    objectId: object.objectId,
    objectTitle: object.titel,
    matches: getMatchesForObject(object.objectId),
  };
}

export function pushMatchNotification(
  object: RealEstateObject,
  matches: ObjektMatchWithKunde[]
): void {
  if (!matches.length) return;

  const count = matches.length;
  pushNotification({
    id: `match-${object.objectId}-${Date.now()}`,
    kind: "anfrage",
    title: `🏠 Neues Objekt: Match für ${count} Interessent${count === 1 ? "en" : "en"}!`,
    message: `${object.titel} in ${object.ort} — ${matches.map((m) => m.kunde_name ?? "Interessent").join(", ")}`,
    href: `/objekte/${encodeURIComponent(object.objectId)}?tab=matches`,
    createdAt: new Date().toISOString(),
    read: false,
    priority: "wichtig",
  });

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("HELPY Matching", {
        body: `Match für ${count} Interessenten: ${object.titel}`,
      });
    }
  }
}

export function markMatchKontaktiert(matchId: string): void {
  hydrate();
  cachedMatches = cachedMatches.map((item) =>
    item.id === matchId ? { ...item, kontaktiert: true } : item
  );
  persistMatches();
  notify();
}
