import { buildAllMailVorgangBundles } from "@/features/mail/mail-vorgang-bundles";
import { analyzeMailThread } from "@/features/mail/services/mail-thread-engine";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { syncOutlookMessagesFromApi } from "@/features/outlook/services/outlook-sync-service";
import { seedGmailVorgangStatusesSilent } from "@/features/workspace/services/status";
import {
  seedHelpyDecisionsFromBundles,
  seedHelpyDecisionsFromListeVorgaenge,
} from "@/features/decision/services/decision-engine";
import {
  seedReplyDraftsFromBundles,
  seedReplyDraftsFromListeVorgaenge,
} from "@/features/reply-drafts/services/reply-draft-engine";
import {
  seedKundenaktenFromBundles,
  seedKundenaktenFromListeVorgaenge,
} from "@/features/kundenakte/services/kundenakte-engine";
import {
  seedRealEstateObjectsFromBundles,
  seedRealEstateObjectsFromListeVorgaenge,
} from "@/features/real-estate/object/object-service";
import { seedPipelineFromGmailBundles, seedPipelineFromListeVorgaenge } from "@/features/crm/pipeline/pipeline-engine";
import {
  seedArchivePreparationsFromBundles,
  seedArchivePreparationsFromListeVorgaenge,
} from "@/features/spam-handling/services/archive-handling-engine";
import {
  bootstrapCustomerMemoryFromGmailCache,
  ingestGmailVorgangBundles,
} from "@/features/memory/services/memory-v2-engine";
import { notifyFromGmailVorgangBundles } from "@/features/notifications/services/notification-emitter";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { findWorkspaceForRequest } from "@/features/workspace/services/vorgaenge/gmail-workspace-resolver";
import {
  deduplicateVorgaenge,
  getVorgangDedupeKey,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import {
  applyCompletedDisplayState,
  ensureCompletedVorgaengeLoaded,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import {
  applyThreadSnapshotToVorgang,
} from "@/features/workspace/services/vorgaenge/vorgang-thread-status";
import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";

const STORAGE_KEY = "helpy-outlook-vorgaenge";

type OutlookVorgaengeCache = {
  vorgaenge: Vorgang[];
  workspaces: Record<string, WorkspaceVorgang>;
  loadedAt: string;
  processedMessageIds?: string[];
  accountEmail?: string | null;
};

const listeners = new Set<() => void>();
let cache: OutlookVorgaengeCache | null = null;
let loading = false;
let syncing = false;

function notify(): void {
  invalidateVorgaengeSummaryCaches();
  listeners.forEach((listener) => listener());
}

function hydrateFromSession(): void {
  if (typeof window === "undefined" || cache) return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as OutlookVorgaengeCache;
    const { vorgaenge } = deduplicateVorgaenge(parsed.vorgaenge);
    cache = { ...parsed, vorgaenge };
  } catch {
    cache = null;
  }
}

function persistToSession(): void {
  if (typeof window === "undefined" || !cache) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function buildEffectiveListeVorgang(match: Vorgang): Vorgang {
  return applyCompletedDisplayState(match);
}

function applyCompletionStateToAll(vorgaenge: Vorgang[]): Vorgang[] {
  return vorgaenge.map((item) => buildEffectiveListeVorgang(item));
}

function applyThreadSnapshots(
  vorgaenge: Vorgang[],
  messages: UnifiedMailMessage[],
  previous: Vorgang[]
): Vorgang[] {
  const previousByThread = new Map(
    previous
      .filter((item) => item.threadId)
      .map((item) => [item.threadId as string, item])
  );

  const groups = new Map<string, UnifiedMailMessage[]>();
  for (const message of messages) {
    const group = groups.get(message.providerThreadId) ?? [];
    group.push(message);
    groups.set(message.providerThreadId, group);
  }

  return vorgaenge.map((vorgang) => {
    if (!vorgang.threadId) return vorgang;
    const threadMessages = groups.get(vorgang.threadId);
    if (!threadMessages?.length) return vorgang;
    const snapshot = analyzeMailThread(threadMessages);
    if (!snapshot) return vorgang;
    return applyThreadSnapshotToVorgang(
      vorgang,
      {
        threadId: snapshot.providerThreadId,
        latestMessageId: snapshot.latestMessageId,
        latestMessageAt: snapshot.latestMessageAt,
        latestMessageFrom: snapshot.latestMessageFrom,
        latestMessageDirection: snapshot.latestMessageDirection,
        hasUnreadExternalMessage: snapshot.hasUnreadExternalMessage,
      },
      previousByThread.get(vorgang.threadId)
    );
  });
}

function seedNewBundles(bundles: GmailVorgangBundle[]): void {
  const customerBundles = bundles.filter(
    (bundle) => !isHelpyReportVorgang(bundle.liste)
  );
  if (customerBundles.length === 0) return;
  seedGmailVorgangStatusesSilent(customerBundles.map((bundle) => bundle.liste));
  seedHelpyDecisionsFromBundles(customerBundles);
  seedReplyDraftsFromBundles(customerBundles);
  seedArchivePreparationsFromBundles(customerBundles);
  seedKundenaktenFromBundles(customerBundles);
  seedRealEstateObjectsFromBundles(customerBundles);
  seedPipelineFromGmailBundles(customerBundles);
  notifyFromGmailVorgangBundles(customerBundles);
  ingestGmailVorgangBundles(customerBundles);
}

function mergeMessagesIntoCache(
  messages: UnifiedMailMessage[],
  accountEmail: string | null
): void {
  hydrateFromSession();
  const previous = cache?.vorgaenge ?? [];
  const incomingOnly = messages.filter(
    (message) =>
      message.direction === "incoming" ||
      previous.some((item) => item.threadId === message.providerThreadId)
  );

  const bundles = buildAllMailVorgangBundles(incomingOnly);
  const rawVorgaenge = bundles.map((bundle) => bundle.liste);
  const combined = [...rawVorgaenge, ...(cache?.vorgaenge ?? [])];
  const { vorgaenge: uniqueVorgaenge } = deduplicateVorgaenge(combined);

  const withThread = applyThreadSnapshots(uniqueVorgaenge, messages, previous);
  const workspaces = Object.fromEntries(
    bundles.map((bundle) => [bundle.liste.id, { ...bundle.workspace, id: bundle.liste.id }])
  );

  cache = {
    vorgaenge: applyCompletionStateToAll(withThread),
    workspaces: {
      ...(cache?.workspaces ?? {}),
      ...workspaces,
    },
    loadedAt: new Date().toISOString(),
    processedMessageIds: [
      ...new Set([
        ...(cache?.processedMessageIds ?? []),
        ...messages.map((message) => message.providerMessageId),
      ]),
    ],
    accountEmail,
  };

  persistToSession();
  seedNewBundles(bundles);
  notify();
}

export function subscribeOutlookVorgaenge(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasOutlookVorgaenge(): boolean {
  hydrateFromSession();
  return (cache?.vorgaenge.length ?? 0) > 0;
}

export function getOutlookVorgaenge(): Vorgang[] {
  hydrateFromSession();
  const raw = cache?.vorgaenge.map((item) => buildEffectiveListeVorgang(item)) ?? [];
  return deduplicateVorgaenge(raw).vorgaenge;
}

export function getOutlookListeVorgang(id: string): Vorgang | null {
  hydrateFromSession();
  const match = cache?.vorgaenge.find(
    (item) =>
      item.id === id ||
      item.href === `/workspace/${id}` ||
      (id.startsWith("brain-v3-outlook-") && item.id === id)
  );
  return match ? buildEffectiveListeVorgang(match) : null;
}

export function getOutlookWorkspaceVorgang(id: string): WorkspaceVorgang | null {
  hydrateFromSession();
  if (!cache) return null;

  const workspace = findWorkspaceForRequest(
    id,
    cache.vorgaenge,
    cache.workspaces
  );

  return workspace ? { ...workspace } : null;
}

export function markVorgangErledigtInOutlookStore(vorgangId: string): void {
  hydrateFromSession();
  if (!cache) return;

  cache.vorgaenge = cache.vorgaenge.map((item) => {
    if (item.id !== vorgangId && item.href !== `/workspace/${vorgangId}`) {
      return item;
    }
    return { ...item, status: "erledigt" };
  });

  persistToSession();
  notify();
}

export function isOutlookVorgaengeLoading(): boolean {
  return loading;
}

export function isOutlookVorgaengeSyncing(): boolean {
  return syncing;
}

export async function loadOutlookVorgaenge(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  loading = true;
  notify();

  try {
    await ensureCompletedVorgaengeLoaded();
    const result = await syncOutlookMessagesFromApi();
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    mergeMessagesIntoCache(result.messages, result.accountEmail);
    return { ok: true, count: cache?.vorgaenge.length ?? 0 };
  } finally {
    loading = false;
    notify();
  }
}

export async function syncOutlookVorgaengeIncremental(): Promise<
  { ok: true; newCount: number } | { ok: false; error: string }
> {
  if (syncing) {
    return { ok: true, newCount: 0 };
  }

  syncing = true;
  notify();

  try {
    await ensureCompletedVorgaengeLoaded();
    hydrateFromSession();
    const before = new Set(
      (cache?.vorgaenge ?? []).map((item) => getVorgangDedupeKey(item))
    );

    const result = await syncOutlookMessagesFromApi();
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    mergeMessagesIntoCache(result.messages, result.accountEmail);

    const after = cache?.vorgaenge ?? [];
    const newCount = after.filter(
      (item) => !before.has(getVorgangDedupeKey(item))
    ).length;

    return { ok: true, newCount };
  } finally {
    syncing = false;
    notify();
  }
}

export function bootstrapOutlookStoreFromSession(): void {
  hydrateFromSession();
  if (!cache?.vorgaenge.length) return;
  seedHelpyDecisionsFromListeVorgaenge(cache.vorgaenge);
  seedReplyDraftsFromListeVorgaenge(cache.vorgaenge);
  seedArchivePreparationsFromListeVorgaenge(cache.vorgaenge);
  seedKundenaktenFromListeVorgaenge(cache.vorgaenge, cache.workspaces);
  seedRealEstateObjectsFromListeVorgaenge(cache.vorgaenge, cache.workspaces);
  seedPipelineFromListeVorgaenge(cache.vorgaenge, cache.workspaces);
  bootstrapCustomerMemoryFromGmailCache(cache.vorgaenge, cache.workspaces);
}
