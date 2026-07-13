import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { buildSlotIso } from "@/features/appointment-suggestions/services/viewing-slot-picker";
import { getLoadedCompanyId } from "@/lib/company/company-profile-service";

const STORAGE_KEY = "helpy-vorgang-termin-v1";

export type VorgangTerminRecord = {
  vorgangId: string;
  companyId: string;
  terminSlots: AppointmentSlot[];
  terminBestaetigt: string | null;
  terminKalenderId: string | null;
  terminIcsContent: string | null;
  updatedAt: string;
};

type TerminStore = Record<string, VorgangTerminRecord>;

let cache: TerminStore | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function readStore(): TerminStore {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = {};
    return cache;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as TerminStore) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function writeStore(store: TerminStore): void {
  cache = store;
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  notify();
}

export function subscribeVorgangTermin(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVorgangTerminRecord(
  vorgangId: string
): VorgangTerminRecord | null {
  return readStore()[vorgangId] ?? null;
}

export function saveOfferedTerminSlots(
  vorgangId: string,
  slots: AppointmentSlot[]
): VorgangTerminRecord {
  const store = readStore();
  const companyId = getLoadedCompanyId() ?? "default";
  const existing = store[vorgangId];
  const record: VorgangTerminRecord = {
    vorgangId,
    companyId,
    terminSlots: slots.map((slot) => ({
      ...slot,
      iso: buildSlotIso(slot.date, slot.start),
    })),
    terminBestaetigt: existing?.terminBestaetigt ?? null,
    terminKalenderId: existing?.terminKalenderId ?? null,
    terminIcsContent: existing?.terminIcsContent ?? null,
    updatedAt: new Date().toISOString(),
  };
  store[vorgangId] = record;
  writeStore(store);
  return record;
}

export function saveConfirmedTermin(input: {
  vorgangId: string;
  slot: AppointmentSlot;
  kalenderId: string | null;
  icsContent: string | null;
}): VorgangTerminRecord {
  const store = readStore();
  const companyId = getLoadedCompanyId() ?? "default";
  const existing = store[input.vorgangId];
  const record: VorgangTerminRecord = {
    vorgangId: input.vorgangId,
    companyId,
    terminSlots: existing?.terminSlots ?? [],
    terminBestaetigt: buildSlotIso(input.slot.date, input.slot.start),
    terminKalenderId: input.kalenderId,
    terminIcsContent: input.icsContent,
    updatedAt: new Date().toISOString(),
  };
  store[input.vorgangId] = record;
  writeStore(store);
  return record;
}

export async function persistTerminToApi(
  vorgangId: string,
  patch: Partial<{
    termin_slots: AppointmentSlot[];
    termin_bestaetigt: string | null;
    termin_kalender_id: string | null;
    termin_ics_url: string | null;
    status: string;
    termin_datum: string;
    termin_uhrzeit: string;
  }>
): Promise<void> {
  try {
    await fetch(`/api/vorgaenge/${encodeURIComponent(vorgangId)}/termin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    // API optional bis DB-Migration ausgeführt
  }
}
