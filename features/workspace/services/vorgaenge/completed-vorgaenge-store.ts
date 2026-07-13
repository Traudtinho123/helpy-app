import { resolveMailProviderFromVorgang } from "@/features/mail/services/mail-provider-registry";
import type { MailProvider } from "@/lib/database/types";
import { createClient } from "@/lib/supabase/client";
import { getUserCompanyId } from "@/lib/user/services/user-profile-service";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { getVorgangDedupeKey } from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import {
  fetchCompletedVorgaengeFromSupabase,
  isCompletedVorgaengeCompanyId,
  markCompletedVorgangReopenedInSupabase,
  resolveAuthenticatedCompanyId,
  upsertCompletedVorgangToSupabase,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-supabase";
import type {
  CompletedVorgangRecord,
  CompletedVorgangStatus,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-types";
import { fromDbStatus } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-types";

export type {
  CompletedVorgangRecord,
  CompletedVorgangStatus,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-types";

const STORAGE_KEY = "helpy-completed-vorgaenge-v1";
const LEGACY_SESSION_KEY = "helpy-completed-vorgaenge";
const REOPENED_HINTS_KEY = "helpy-reopened-vorgang-hints-v1";

export const VORGANG_REOPENED_HELpy_MESSAGE =
  "Der Kunde hat erneut geantwortet. Ich habe den Vorgang wieder geöffnet.";

type LegacyCompletedRecord = {
  id?: string;
  companyId?: string;
  company_id?: string;
  workspaceId?: string;
  workspace_id?: string;
  provider?: MailProvider;
  providerThreadId?: string | null;
  provider_thread_id?: string | null;
  providerMessageId?: string | null;
  provider_message_id?: string | null;
  caseId?: string;
  case_id?: string;
  vorgangId?: string;
  threadId?: string | null;
  gmailThreadId?: string | null;
  messageIds?: string[];
  gmailMessageIds?: string[];
  lastMessageAt?: string;
  latestMessageAt?: string;
  lastKnownIncomingMessageAt?: string | null;
  last_known_incoming_message_at?: string | null;
  lastKnownOutgoingMessageAt?: string | null;
  last_known_outgoing_message_at?: string | null;
  completedAt?: string;
  completed_at?: string;
  completedBy?: string | null;
  completed_by?: string | null;
  completedByUserId?: string | null;
  status?: CompletedVorgangStatus;
  updatedAt?: string;
  updated_at?: string;
};

let records: CompletedVorgangRecord[] = [];
let reopenedHints = new Map<string, string>();
let hydrated = false;
let supabaseHydratedForCompany: string | null = null;
let supabaseLoadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  invalidateVorgaengeSummaryCaches();
  listeners.forEach((listener) => listener());
}

export function subscribeCompletedVorgaenge(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function parseTimestamp(value?: string | null): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function resolveProvider(vorgang: Vorgang): MailProvider {
  return resolveMailProviderFromVorgang(vorgang);
}

function resolveCompanyId(): string {
  try {
    return getUserCompanyId() || "";
  } catch {
    return "";
  }
}

function collectVorgangMessageIds(vorgang: Vorgang): string[] {
  const ids = [vorgang.sourceEventId, vorgang.id];

  if (vorgang.id.startsWith("brain-v3-outlook-")) {
    ids.push(vorgang.id.slice("brain-v3-outlook-".length));
  } else if (vorgang.id.startsWith("brain-v3-")) {
    ids.push(vorgang.id.slice("brain-v3-".length));
  }

  if (vorgang.threadId) {
    ids.push(`thread-${vorgang.threadId}`);
  }

  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function resolveStableCaseId(vorgang: Vorgang): string {
  return getVorgangDedupeKey(vorgang);
}

function resolveProviderMessageId(vorgang: Vorgang): string | null {
  if (vorgang.sourceEventId) return vorgang.sourceEventId;
  if (vorgang.id.startsWith("brain-v3-outlook-")) {
    return vorgang.id.slice("brain-v3-outlook-".length);
  }
  if (vorgang.id.startsWith("brain-v3-")) {
    return vorgang.id.slice("brain-v3-".length);
  }
  return vorgang.id;
}

function resolveIncomingAt(vorgang: Vorgang): string | null {
  if (vorgang.latestMessageDirection === "outgoing") {
    return null;
  }
  return (
    vorgang.latestMessageAt ??
    vorgang.emailDate ??
    vorgang.receivedAt ??
    null
  );
}

function resolveOutgoingAt(vorgang: Vorgang): string | null {
  if (vorgang.latestMessageDirection === "outgoing") {
    return (
      vorgang.latestMessageAt ??
      vorgang.emailDate ??
      vorgang.receivedAt ??
      null
    );
  }
  return null;
}

function normalizeRecord(raw: LegacyCompletedRecord): CompletedVorgangRecord | null {
  const vorgangId = raw.vorgangId ?? raw.workspaceId ?? raw.workspace_id ?? raw.caseId ?? raw.case_id;
  if (!vorgangId) return null;

  const providerThreadId =
    raw.providerThreadId ??
    raw.provider_thread_id ??
    raw.gmailThreadId ??
    raw.threadId ??
    null;

  const provider: MailProvider =
    raw.provider ??
    (typeof raw.caseId === "string" && raw.caseId.startsWith("outlook:")
      ? "outlook"
      : typeof raw.case_id === "string" && raw.case_id.startsWith("outlook:")
        ? "outlook"
        : "gmail");

  const gmailMessageIds = [
    ...new Set([...(raw.gmailMessageIds ?? raw.messageIds ?? []), vorgangId]),
  ];

  const lastKnownIncomingMessageAt =
    raw.lastKnownIncomingMessageAt ??
    raw.last_known_incoming_message_at ??
    raw.latestMessageAt ??
    raw.lastMessageAt ??
    null;

  const lastKnownOutgoingMessageAt =
    raw.lastKnownOutgoingMessageAt ??
    raw.last_known_outgoing_message_at ??
    null;

  const completedAt =
    raw.completedAt ?? raw.completed_at ?? new Date().toISOString();
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? completedAt;
  const completedBy =
    raw.completedBy ?? raw.completed_by ?? raw.completedByUserId ?? null;
  const caseId = raw.caseId ?? raw.case_id ?? vorgangId;
  const workspaceId = raw.workspaceId ?? raw.workspace_id ?? vorgangId;
  const companyId = raw.companyId ?? raw.company_id ?? "";
  const providerMessageId =
    raw.providerMessageId ??
    raw.provider_message_id ??
    gmailMessageIds.find((id) => !id.startsWith("thread-") && id !== vorgangId) ??
    null;

  return {
    id: raw.id,
    companyId,
    workspaceId,
    provider,
    providerThreadId,
    providerMessageId,
    caseId,
    vorgangId,
    gmailThreadId: providerThreadId,
    gmailMessageIds,
    status: fromDbStatus(raw.status),
    completedAt,
    completedBy,
    completedByUserId: completedBy,
    lastKnownIncomingMessageAt,
    lastKnownOutgoingMessageAt,
    latestMessageAt:
      lastKnownIncomingMessageAt ??
      lastKnownOutgoingMessageAt ??
      completedAt,
    updatedAt,
  };
}

function recordIdentityKey(item: CompletedVorgangRecord): string {
  if (item.providerThreadId) {
    return `${item.provider}:thread:${item.providerThreadId}:company:${item.companyId || ""}`;
  }
  return `${item.provider}:case:${item.caseId}:company:${item.companyId || ""}`;
}

function dedupeRecords(items: CompletedVorgangRecord[]): CompletedVorgangRecord[] {
  const byKey = new Map<string, CompletedVorgangRecord>();

  for (const item of items) {
    if (item.status !== "Erledigt") continue;

    const key = recordIdentityKey(item);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    byKey.set(key, {
      ...existing,
      ...item,
      id: item.id ?? existing.id,
      gmailMessageIds: [
        ...new Set([...existing.gmailMessageIds, ...item.gmailMessageIds]),
      ],
      lastKnownIncomingMessageAt:
        parseTimestamp(item.lastKnownIncomingMessageAt) >=
        parseTimestamp(existing.lastKnownIncomingMessageAt)
          ? item.lastKnownIncomingMessageAt
          : existing.lastKnownIncomingMessageAt,
      lastKnownOutgoingMessageAt:
        parseTimestamp(item.lastKnownOutgoingMessageAt) >=
        parseTimestamp(existing.lastKnownOutgoingMessageAt)
          ? item.lastKnownOutgoingMessageAt
          : existing.lastKnownOutgoingMessageAt,
      latestMessageAt:
        parseTimestamp(item.latestMessageAt) >= parseTimestamp(existing.latestMessageAt)
          ? item.latestMessageAt
          : existing.latestMessageAt,
      completedAt:
        parseTimestamp(item.completedAt) >= parseTimestamp(existing.completedAt)
          ? item.completedAt
          : existing.completedAt,
      updatedAt:
        parseTimestamp(item.updatedAt) >= parseTimestamp(existing.updatedAt)
          ? item.updatedAt
          : existing.updatedAt,
    });
  }

  return [...byKey.values()];
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const legacy = window.sessionStorage.getItem(LEGACY_SESSION_KEY);
      if (legacy) {
        raw = legacy;
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw) as LegacyCompletedRecord[];
      records = dedupeRecords(
        parsed
          .map(normalizeRecord)
          .filter((item): item is CompletedVorgangRecord => item !== null)
      );
    }

    const hintsRaw = window.localStorage.getItem(REOPENED_HINTS_KEY);
    if (hintsRaw) {
      const parsed = JSON.parse(hintsRaw) as Record<string, string>;
      reopenedHints = new Map(Object.entries(parsed));
    }
  } catch {
    records = [];
    reopenedHints = new Map();
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function persistReopenedHints(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    REOPENED_HINTS_KEY,
    JSON.stringify(Object.fromEntries(reopenedHints))
  );
}

function mergeRemoteRecords(remote: CompletedVorgangRecord[]): boolean {
  hydrate();
  const before = records.map(recordIdentityKey).sort().join("|");
  records = dedupeRecords([...records, ...remote]);
  const after = records.map(recordIdentityKey).sort().join("|");
  if (before === after) return false;
  persist();
  return true;
}

/** Stabile Zuordnung: 1. providerThreadId, 2. caseId, 3. messageId. */
export function findCompletedRecord(
  vorgang: Vorgang
): CompletedVorgangRecord | undefined {
  hydrate();

  const provider = resolveProvider(vorgang);
  const dedupeKey = resolveStableCaseId(vorgang);
  const messageIds = collectVorgangMessageIds(vorgang);

  if (vorgang.threadId) {
    const byThread = records.find(
      (item) =>
        item.status === "Erledigt" &&
        item.provider === provider &&
        item.providerThreadId === vorgang.threadId
    );
    if (byThread) return byThread;
  }

  const byCase = records.find(
    (item) =>
      item.status === "Erledigt" &&
      (item.caseId === dedupeKey ||
        item.caseId === vorgang.id ||
        item.vorgangId === vorgang.id ||
        item.workspaceId === vorgang.id)
  );
  if (byCase) return byCase;

  return records.find(
    (item) =>
      item.status === "Erledigt" &&
      messageIds.some((id) => item.gmailMessageIds.includes(id))
  );
}

function buildCompletedRecord(
  vorgang: Vorgang,
  completedByUserId: string | null
): CompletedVorgangRecord {
  const caseId = resolveStableCaseId(vorgang);
  const messageIds = collectVorgangMessageIds(vorgang);
  const provider = resolveProvider(vorgang);
  const now = new Date().toISOString();
  const incomingAt = resolveIncomingAt(vorgang);
  const outgoingAt = resolveOutgoingAt(vorgang);
  const fallbackAt = vorgang.emailDate ?? vorgang.receivedAt ?? now;
  const knownIncomingAt =
    incomingAt ??
    (vorgang.latestMessageDirection === "outgoing"
      ? vorgang.emailDate ?? vorgang.receivedAt ?? null
      : fallbackAt);

  return {
    companyId: resolveCompanyId(),
    workspaceId: vorgang.id,
    provider,
    providerThreadId: vorgang.threadId ?? null,
    providerMessageId: resolveProviderMessageId(vorgang),
    caseId,
    vorgangId: vorgang.id,
    gmailThreadId: vorgang.threadId ?? null,
    gmailMessageIds: messageIds,
    status: "Erledigt",
    completedAt: now,
    completedBy: completedByUserId,
    completedByUserId,
    lastKnownIncomingMessageAt: knownIncomingAt,
    lastKnownOutgoingMessageAt: outgoingAt,
    latestMessageAt: knownIncomingAt ?? outgoingAt ?? fallbackAt,
    updatedAt: now,
  };
}

export function registerCompletedVorgang(
  vorgang: Vorgang,
  completedByUserId: string | null = null
): CompletedVorgangRecord {
  hydrate();

  const record = buildCompletedRecord(vorgang, completedByUserId);
  const existing = findCompletedRecord(vorgang);

  if (existing) {
    const merged: CompletedVorgangRecord = {
      ...existing,
      ...record,
      id: existing.id,
      gmailMessageIds: [
        ...new Set([...existing.gmailMessageIds, ...record.gmailMessageIds]),
      ],
      lastKnownIncomingMessageAt:
        parseTimestamp(record.lastKnownIncomingMessageAt) >=
        parseTimestamp(existing.lastKnownIncomingMessageAt)
          ? record.lastKnownIncomingMessageAt
          : existing.lastKnownIncomingMessageAt,
      lastKnownOutgoingMessageAt:
        parseTimestamp(record.lastKnownOutgoingMessageAt) >=
        parseTimestamp(existing.lastKnownOutgoingMessageAt)
          ? record.lastKnownOutgoingMessageAt
          : existing.lastKnownOutgoingMessageAt,
    };
    records = dedupeRecords(
      records
        .filter((item) => recordIdentityKey(item) !== recordIdentityKey(existing))
        .concat(merged)
    );
  } else {
    records = dedupeRecords([...records, record]);
  }

  reopenedHints.delete(vorgang.id);
  persistReopenedHints();
  persist();
  notify();

  const saved = findCompletedRecord(vorgang) ?? record;

  if (completedByUserId) {
    void upsertCompletedVorgangToSupabase(saved, completedByUserId).then(
      (remote) => {
        if (!remote?.id) return;
        hydrate();
        const current = findCompletedRecord(vorgang);
        if (!current) return;
        const withId = { ...current, id: remote.id };
        records = dedupeRecords(
          records
            .filter((item) => recordIdentityKey(item) !== recordIdentityKey(current))
            .concat(withId)
        );
        persist();
      }
    );
  }

  return saved;
}

/** Persistiert Erledigt sofort in Supabase und lokal. */
export async function registerCompletedVorgangPersistent(
  vorgang: Vorgang,
  completedByUserId: string | null = null
): Promise<CompletedVorgangRecord> {
  const local = registerCompletedVorgang(vorgang, completedByUserId);

  if (!completedByUserId) return local;

  const remote = await upsertCompletedVorgangToSupabase(local, completedByUserId);
  if (!remote) return local;

  hydrate();
  const current = findCompletedRecord(vorgang) ?? local;
  const merged = { ...current, ...remote, id: remote.id };
  records = dedupeRecords(
    records
      .filter((item) => recordIdentityKey(item) !== recordIdentityKey(current))
      .concat(merged)
  );
  persist();
  notify();
  return merged;
}

export function getCompletedVorgangRecords(): CompletedVorgangRecord[] {
  hydrate();
  return [...records];
}

export function isVorgangCompleted(vorgang: Vorgang): boolean {
  return findCompletedRecord(vorgang) !== undefined;
}

/**
 * Unterdrückt erneutes Anzeigen, solange keine neuere eingehende Kundenmail vorliegt.
 * Unternehmensantworten öffnen den Vorgang nicht.
 */
export function shouldSuppressReopenedVorgang(
  vorgang: Vorgang,
  incomingMessageAt?: string
): boolean {
  hydrate();

  const match = findCompletedRecord(vorgang);
  if (!match || match.status !== "Erledigt") return false;

  // Unternehmensantwort / ausgehende Mail öffnet nie.
  if (vorgang.latestMessageDirection === "outgoing") {
    return true;
  }

  const candidateIncomingAt =
    incomingMessageAt ??
    (vorgang.latestMessageDirection === "incoming"
      ? vorgang.latestMessageAt ?? vorgang.emailDate ?? vorgang.receivedAt
      : null);

  // Ohne erkennbare neuere Kundenmail bleibt erledigt.
  if (!candidateIncomingAt) {
    return true;
  }

  const incomingTs = parseTimestamp(candidateIncomingAt);
  const completedIncomingTs = parseTimestamp(match.lastKnownIncomingMessageAt);

  if (completedIncomingTs > 0) {
    return incomingTs <= completedIncomingTs;
  }

  const snapshotAtTs = parseTimestamp(match.latestMessageAt);
  if (snapshotAtTs > 0) {
    return incomingTs <= snapshotAtTs;
  }

  return incomingTs <= parseTimestamp(match.completedAt);
}

/**
 * Wendet Erledigt-Status für die Listen-Anzeige an — ohne Store-Mutation.
 * Reopen-Löschung passiert nur im Thread-Sync (applyThreadSnapshotToVorgang).
 */
export function applyCompletedDisplayState(vorgang: Vorgang): Vorgang {
  if (shouldSuppressReopenedVorgang(vorgang)) {
    if (vorgang.latestMessageDirection === "outgoing") {
      if (vorgang.status === "wartend") return vorgang;
      return { ...vorgang, status: "wartend" };
    }
    if (vorgang.status === "erledigt") return vorgang;
    return { ...vorgang, status: "erledigt" };
  }

  const hint = getReopenedVorgangHint(vorgang.id);
  if (hint) {
    return { ...vorgang, status: "neu", helpyMessage: hint };
  }

  if (isVorgangCompleted(vorgang)) {
    return { ...vorgang, status: "erledigt" };
  }

  return vorgang;
}

function markVorgangReopened(vorgang: Vorgang): void {
  reopenedHints.set(vorgang.id, VORGANG_REOPENED_HELpy_MESSAGE);
  persistReopenedHints();
}

function removeLocalCompletedRecord(match: CompletedVorgangRecord): void {
  records = records.filter(
    (item) => recordIdentityKey(item) !== recordIdentityKey(match)
  );
  persist();
  notify();
}

/** Entfernt Erledigt-Markierung für Undo (ohne neue Kundenmail). */
export function undoCompletedVorgang(vorgang: Vorgang): void {
  hydrate();
  const match = findCompletedRecord(vorgang);
  if (!match) return;
  removeLocalCompletedRecord(match);
}

/** Entfernt Erledigt-Markierung, wenn eine neuere Kunden-Nachricht vorliegt. */
export function clearCompletedVorgangIfReopened(vorgang: Vorgang): void {
  hydrate();

  // Nur eingehende Kundenmails reaktivieren.
  if (vorgang.latestMessageDirection === "outgoing") return;
  if (shouldSuppressReopenedVorgang(vorgang)) return;

  const match = findCompletedRecord(vorgang);
  if (!match) return;

  markVorgangReopened(vorgang);
  removeLocalCompletedRecord(match);

  const incomingAt =
    vorgang.latestMessageAt ??
    vorgang.emailDate ??
    vorgang.receivedAt ??
    new Date().toISOString();

  const companyId = match.companyId || resolveCompanyId();
  if (companyId) {
    void markCompletedVorgangReopenedInSupabase({
      companyId,
      caseId: match.caseId,
      provider: match.provider,
      providerThreadId: match.providerThreadId,
      lastKnownIncomingMessageAt: incomingAt,
    });
  }
}

export function getReopenedVorgangHint(vorgangId: string): string | null {
  hydrate();
  return reopenedHints.get(vorgangId) ?? null;
}

export function clearReopenedVorgangHint(vorgangId: string): void {
  hydrate();
  if (!reopenedHints.has(vorgangId)) return;
  reopenedHints.delete(vorgangId);
  persistReopenedHints();
}

export function filterOutCompletedVorgaenge(vorgaenge: Vorgang[]): Vorgang[] {
  return vorgaenge.filter((item) => !shouldSuppressReopenedVorgang(item));
}

export function getCompletedDedupeKeys(): Set<string> {
  hydrate();
  return new Set(
    records.flatMap((item) => {
      const keys = [`case:${item.caseId}`, `case:${item.vorgangId}`];
      if (item.providerThreadId) {
        keys.push(`thread:${item.providerThreadId}`);
        keys.push(`${item.provider}:thread:${item.providerThreadId}`);
      }
      for (const messageId of item.gmailMessageIds) {
        keys.push(`message:${messageId}`);
      }
      return keys;
    })
  );
}

export function getVorgangCompletionKey(vorgang: Vorgang): string {
  return getVorgangDedupeKey(vorgang);
}

/**
 * Lädt completed_vorgaenge aus Supabase vor dem Anzeigen von Vorgängen.
 * Lokal bleibt Cache; Supabase ist Source of Truth für Erledigt.
 */
export async function ensureCompletedVorgaengeLoaded(
  userId?: string | null
): Promise<void> {
  hydrate();

  let resolvedUserId = userId ?? null;
  if (!resolvedUserId) {
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    resolvedUserId = session?.user?.id ?? null;
  }

  if (!resolvedUserId) return;

  const companyId =
    (await resolveAuthenticatedCompanyId()) ??
    (isCompletedVorgaengeCompanyId(resolveCompanyId()) ? resolveCompanyId() : null);
  if (!companyId) return;
  if (supabaseHydratedForCompany === companyId) return;

  if (supabaseLoadPromise) {
    await supabaseLoadPromise;
    return;
  }

  supabaseLoadPromise = (async () => {
    const result = await fetchCompletedVorgaengeFromSupabase(companyId);
    // Tabelle fehlt / Fehler: localStorage bleibt gültig, App läuft weiter.
    if (!result.ok && !result.tableMissing) return;
    if (result.records.length > 0) {
      const changed = mergeRemoteRecords(result.records);
      if (changed) notify();
    }

    // Lokale Erledigt-Einträge (z. B. vor Migration) nach Supabase spiegeln.
    await backfillLocalCompletedVorgaengeToSupabase(resolvedUserId!, companyId);

    // Auch bei tableMissing als „geladen“ markieren, damit Sync nicht spamt.
    supabaseHydratedForCompany = companyId;
  })();

  try {
    await supabaseLoadPromise;
  } finally {
    supabaseLoadPromise = null;
  }
}

/** Nur für Tests: setzt In-Memory- und Hydration-State zurück. */
export function resetCompletedVorgaengeStoreForTests(): void {
  records = [];
  reopenedHints = new Map();
  hydrated = false;
  supabaseHydratedForCompany = null;
  supabaseLoadPromise = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(REOPENED_HINTS_KEY);
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

async function backfillLocalCompletedVorgaengeToSupabase(
  userId: string,
  companyId: string
): Promise<void> {
  hydrate();
  const localRecords = getCompletedVorgangRecords();
  if (localRecords.length === 0) return;

  await Promise.all(
    localRecords.map((record) =>
      upsertCompletedVorgangToSupabase(record, userId, companyId)
    )
  );
}

/** Nur für Tests: simuliert Reload/Login ohne localStorage zu leeren. */
export function simulateCompletedVorgaengeStoreReloadForTests(): void {
  records = [];
  reopenedHints = new Map();
  hydrated = false;
  supabaseHydratedForCompany = null;
  supabaseLoadPromise = null;
}
