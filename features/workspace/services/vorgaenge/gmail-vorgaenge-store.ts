import { analyzeGmailMessages } from "@/features/brain/services/brain-v3";
import {
  buildGmailVorgangBundles,
  type GmailVorgangBundle,
} from "@/features/brain/services/brain-result-to-vorgang";
import { mapGmailMessageToUnifiedMail } from "@/features/mail/services/unified-mail-mapper";
import { buildAllMailVorgangBundles } from "@/features/mail/mail-vorgang-bundles";
import { isHelpySystemMail } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { buildHelpyReportBundleFromGmailMessage } from "@/features/workspace/services/vorgaenge/helpy-report-vorgang";
import { persistMailBundleToDb } from "@/features/vorgaenge/services/create-vorgang-client";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import {
  dedupeUnifiedMailAttachments,
  mergeThreadAttachments,
} from "@/features/mail/services/mail-attachment-mapper";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import { invalidateRecognizedDocumentsCache } from "@/features/documents/intelligence/document-recognition-service";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";

function resolveAnalyzeSkill(): HelpySkill {
  try {
    return getCompanyProfileSnapshot().activePaidSkill ?? DEFAULT_HELPY_SKILL;
  } catch {
    return DEFAULT_HELPY_SKILL;
  }
}
import {
  isAppointmentVorgang,
  loadAppointmentSuggestionForWorkspace,
  processViewingConfirmationFromMessage,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  fetchGmailThreadMessages,
  fetchRecentGmailMessages,
} from "@/features/gmail/services/gmail/connector";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import {
  analyzeGmailThread,
  buildThreadSnapshotsFromMessages,
  type GmailThreadSnapshot,
} from "@/features/gmail/services/gmail/thread-direction";
import { seedGmailVorgangStatusesSilent } from "@/features/workspace/services/status";
import {
  seedHelpyDecisionsFromBundles,
  seedHelpyDecisionsFromListeVorgaenge,
} from "@/features/decision/services/decision-engine";
import {
  seedReplyDraftsFromBundles,
  seedReplyDraftsFromListeVorgaenge,
  removeReplyDraft,
} from "@/features/reply-drafts/services/reply-draft-engine";
import {
  seedKundenaktenFromBundles,
  seedKundenaktenFromListeVorgaenge,
} from "@/features/kundenakte/services/kundenakte-engine";
import { seedRealEstateObjectsFromBundles, seedRealEstateObjectsFromListeVorgaenge } from "@/features/real-estate/object/object-service";
import { seedRecognizedDocumentsFromBundles } from "@/features/documents/intelligence/document-recognition-service";
import { seedPipelineFromGmailBundles, seedPipelineFromListeVorgaenge } from "@/features/crm/pipeline/pipeline-engine";
import {
  seedArchivePreparationsFromBundles,
  seedArchivePreparationsFromListeVorgaenge,
  shouldPrepareArchive,
} from "@/features/spam-handling/services/archive-handling-engine";
import {
  bootstrapCustomerMemoryFromGmailCache,
  ingestGmailVorgangBundles,
} from "@/features/memory/services/memory-v2-engine";
import { notifyFromGmailVorgangBundles } from "@/features/notifications/services/notification-emitter";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import {
  deduplicateVorgaenge,
  getVorgangDedupeKey,
  mergeVorgaengeGroup,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import {
  findWorkspaceForRequest,
  reindexWorkspacesForVorgaenge,
  resolveVorgangOpenId,
} from "@/features/workspace/services/vorgaenge/gmail-workspace-resolver";
import {
  applyThreadSnapshotsToVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-thread-status";
import {
  shouldSuppressReopenedVorgang,
  applyCompletedDisplayState,
  ensureCompletedVorgaengeLoaded,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { filterVisibleVorgaenge } from "@/features/workspace/services/vorgang-visibility-store";
import {
  getActiveOpenMailCasesCount,
  invalidateVorgaengeSummaryCaches,
} from "@/features/workspace/services/vorgaenge/vorgaenge-summary";

const STORAGE_KEY = "helpy-gmail-vorgaenge";

export type GmailSyncContext = {
  ownEmail?: string | null;
  connectionId?: string;
  /** Server-OAuth-Sync: Nachrichten bereits geladen, kein Client-Token. */
  prefetchedMessages?: GmailConnectorMessage[];
};

function buildBundlesFromMessages(
  messages: GmailConnectorMessage[],
  context: GmailSyncContext
): GmailVorgangBundle[] {
  const skill = resolveAnalyzeSkill();

  if (context.connectionId) {
    const unified = messages.map((message) =>
      mapGmailMessageToUnifiedMail(
        message,
        context.ownEmail ?? null,
        context.connectionId
      )
    );
    return buildAllMailVorgangBundles(unified, skill);
  }

  const bundles: GmailVorgangBundle[] = [];
  const forBrain: GmailConnectorMessage[] = [];

  for (const message of messages) {
    if (
      isHelpySystemMail({
        subject: message.subject,
        from: message.from,
        sourceAccountEmail: context.ownEmail ?? null,
      })
    ) {
      bundles.push(
        buildHelpyReportBundleFromGmailMessage(
          message,
          context.ownEmail ?? null,
          context.connectionId
        )
      );
    } else {
      forBrain.push(message);
    }
  }

  if (forBrain.length > 0) {
    const results = analyzeGmailMessages(forBrain, { activeSkill: skill });
    bundles.push(...buildGmailVorgangBundles(results, forBrain));
  }

  return bundles;
}

/** Befüllt mailConnectionId + mailAttachments für bestehende Cache-Vorgänge. */
function backfillGmailVorgaengeMailMetadata(
  messages: GmailConnectorMessage[],
  context: GmailSyncContext
): boolean {
  if (!context.connectionId || !cache || messages.length === 0) {
    return false;
  }

  const attachmentsByThread = new Map<string, UnifiedMailAttachment[]>();
  const attachmentsByMessage = new Map<string, UnifiedMailAttachment[]>();

  for (const message of messages) {
    const unified = mapGmailMessageToUnifiedMail(
      message,
      context.ownEmail ?? null,
      context.connectionId
    );
    if (unified.attachments.length === 0) continue;

    const threadId = unified.providerThreadId;
    attachmentsByThread.set(
      threadId,
      mergeThreadAttachments([
        ...(attachmentsByThread.get(threadId) ?? []),
        ...unified.attachments,
      ])
    );

    attachmentsByMessage.set(
      unified.providerMessageId,
      mergeThreadAttachments([
        ...(attachmentsByMessage.get(unified.providerMessageId) ?? []),
        ...unified.attachments,
      ])
    );
  }

  if (attachmentsByThread.size === 0 && attachmentsByMessage.size === 0) {
    return false;
  }

  let changed = false;

  cache.vorgaenge = cache.vorgaenge.map((vorgang) => {
    const threadAttachments = vorgang.threadId
      ? attachmentsByThread.get(vorgang.threadId)
      : undefined;
    const messageAttachments = vorgang.sourceEventId
      ? attachmentsByMessage.get(vorgang.sourceEventId)
      : undefined;
    const resolved = threadAttachments ?? messageAttachments;

    if (!resolved?.length) {
      return vorgang;
    }

    const nextAttachments = dedupeUnifiedMailAttachments([
      ...(vorgang.mailAttachments ?? []),
      ...resolved,
    ]);

    if (
      vorgang.mailConnectionId === context.connectionId &&
      vorgang.mailAttachments?.length === nextAttachments.length &&
      vorgang.mailProvider === "gmail"
    ) {
      return vorgang;
    }

    changed = true;
    invalidateRecognizedDocumentsCache(vorgang.id);

    return {
      ...vorgang,
      mailProvider: "gmail" as const,
      mailConnectionId: context.connectionId,
      mailAttachments: nextAttachments,
    };
  });

  if (changed) {
    persistToSession();
    invalidateListeSnapshot();
  }

  return changed;
}

type GmailVorgaengeCache = {
  vorgaenge: Vorgang[];
  workspaces: Record<string, WorkspaceVorgang>;
  loadedAt: string;
  processedMessageIds?: string[];
  threadMessages?: Record<string, GmailConnectorMessage[]>;
};

const listeners = new Set<() => void>();

type CachedListeSnapshot = {
  cacheKey: string;
  value: Vorgang;
};

const listeSnapshots = new Map<string, CachedListeSnapshot>();

function buildListeCacheKey(vorgang: Vorgang): string {
  return [
    vorgang.id,
    vorgang.status,
    vorgang.receivedAt,
    vorgang.emailDate ?? "",
    vorgang.threadId ?? "",
    vorgang.latestMessageDirection ?? "",
    vorgang.summary ?? "",
    vorgang.mailConnectionId ?? "",
    String(vorgang.mailAttachments?.length ?? 0),
    shouldSuppressReopenedVorgang(vorgang) ? "suppressed" : "active",
  ].join("|");
}

function buildEffectiveListeVorgang(match: Vorgang): Vorgang {
  return applyCompletedDisplayState(match);
}

function resolveListeSnapshot(match: Vorgang): Vorgang {
  const cacheKey = buildListeCacheKey(match);
  const cached = listeSnapshots.get(match.id);
  if (cached?.cacheKey === cacheKey) {
    return cached.value;
  }

  const value = buildEffectiveListeVorgang(match);
  listeSnapshots.set(match.id, { cacheKey, value });
  return value;
}

function notify(): void {
  invalidateVorgaengeSummaryCaches();
  listeners.forEach((listener) => listener());
}

function invalidateListeSnapshot(vorgangId?: string): void {
  if (vorgangId) {
    listeSnapshots.delete(vorgangId);
    return;
  }
  listeSnapshots.clear();
}

let cache: GmailVorgaengeCache | null = null;
let loading = false;
let syncing = false;

function hydrateFromSession(): void {
  if (typeof window === "undefined" || cache) return;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as GmailVorgaengeCache;
    const { vorgaenge } = deduplicateVorgaenge(parsed.vorgaenge);
    const workspaces = reindexWorkspacesForVorgaenge(
      vorgaenge,
      parsed.vorgaenge,
      parsed.workspaces ?? {}
    );
    cache = { ...parsed, vorgaenge, workspaces };
    bootstrapFromSession();
  } catch {
    cache = null;
  }
}

function persistToSession(): void {
  if (typeof window === "undefined" || !cache) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function getKnownMessageIds(): Set<string> {
  hydrateFromSession();
  const ids = new Set<string>();

  for (const messageId of cache?.processedMessageIds ?? []) {
    ids.add(messageId);
  }

  for (const vorgang of cache?.vorgaenge ?? []) {
    if (vorgang.sourceEventId) {
      ids.add(vorgang.sourceEventId);
    }
  }

  return ids;
}

function collectProcessedMessageIds(vorgaenge: Vorgang[]): string[] {
  return [
    ...new Set(
      vorgaenge
        .map((vorgang) => vorgang.sourceEventId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
}

function applyCompletionStateToAll(vorgaenge: Vorgang[]): Vorgang[] {
  return vorgaenge.map((item) => resolveListeSnapshot(item));
}

async function fetchThreadSnapshots(
  accessToken: string,
  threadIds: string[],
  ownEmail: string | null | undefined,
  fallbackMessages: GmailConnectorMessage[] = []
): Promise<Map<string, GmailThreadSnapshot>> {
  const ownEmails = ownEmail ? [ownEmail] : [];
  const snapshots = buildThreadSnapshotsFromMessages(fallbackMessages, ownEmails);
  const uniqueThreadIds = [...new Set(threadIds.filter(Boolean))];

  await Promise.all(
    uniqueThreadIds.map(async (threadId) => {
      try {
        const threadMessages = await fetchGmailThreadMessages(accessToken, threadId);
        if (cache) {
          cache.threadMessages = {
            ...(cache.threadMessages ?? {}),
            [threadId]: threadMessages,
          };
        }
        const snapshot = analyzeGmailThread(threadMessages, ownEmails);
        if (snapshot) {
          snapshots.set(threadId, snapshot);
        }
      } catch {
        const cachedMessages = cache?.threadMessages?.[threadId];
        if (cachedMessages?.length) {
          const snapshot = analyzeGmailThread(cachedMessages, ownEmails);
          if (snapshot) {
            snapshots.set(threadId, snapshot);
          }
        }
      }
    })
  );

  return snapshots;
}

async function applyThreadStatusToCache(
  accessToken: string,
  threadIds: string[],
  context: GmailSyncContext = {},
  fallbackMessages: GmailConnectorMessage[] = []
): Promise<void> {
  hydrateFromSession();
  if (!cache || threadIds.length === 0) return;

  const previousVorgaenge = [...cache.vorgaenge];
  const snapshots = await fetchThreadSnapshots(
    accessToken,
    threadIds,
    context.ownEmail,
    fallbackMessages
  );

  cache.vorgaenge = applyCompletionStateToAll(
    applyThreadSnapshotsToVorgaenge(
      cache.vorgaenge,
      snapshots,
      previousVorgaenge
    )
  );

  persistToSession();
  invalidateListeSnapshot();
  notify();
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
  seedRecognizedDocumentsFromBundles(customerBundles);
  seedPipelineFromGmailBundles(customerBundles);
  notifyFromGmailVorgangBundles(customerBundles);
  ingestGmailVorgangBundles(customerBundles);

  for (const bundle of customerBundles) {
    void persistMailBundleToDb(bundle);
  }

  for (const bundle of customerBundles) {
    if (shouldPrepareArchive(bundle.liste)) {
      removeReplyDraft(bundle.liste.id);
      continue;
    }
    if (isAppointmentVorgang(bundle.workspace, bundle.liste)) {
      void loadAppointmentSuggestionForWorkspace(bundle.workspace, bundle.liste);
    }
  }
}

function deduplicateBundles(
  bundles: GmailVorgangBundle[]
): GmailVorgangBundle[] {
  const groups = new Map<string, GmailVorgangBundle[]>();

  for (const bundle of bundles) {
    const key = getVorgangDedupeKey(bundle.liste);
    const group = groups.get(key) ?? [];
    group.push(bundle);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0];

    const mergedListe = mergeVorgaengeGroup(group.map((item) => item.liste));
    const canonical =
      group.find((item) => item.liste.id === mergedListe.id) ?? group[0];

    return {
      ...canonical,
      liste: mergedListe,
    };
  });
}

function applyCacheFromBundles(bundles: GmailVorgangBundle[]): void {
  const dedupedBundles = deduplicateBundles(bundles);
  const rawVorgaenge = dedupedBundles.map((bundle) => bundle.liste);
  const { vorgaenge: uniqueVorgaenge } = deduplicateVorgaenge(rawVorgaenge);
  const workspaceSeed = Object.fromEntries(
    dedupedBundles.map((bundle) => [bundle.liste.id, bundle.workspace])
  );
  const workspaces = reindexWorkspacesForVorgaenge(
    uniqueVorgaenge,
    rawVorgaenge,
    workspaceSeed
  );

  cache = {
    vorgaenge: applyCompletionStateToAll(uniqueVorgaenge),
    workspaces,
    loadedAt: new Date().toISOString(),
    processedMessageIds: collectProcessedMessageIds(
      bundles.map((bundle) => bundle.liste)
    ),
  };
  persistToSession();
  invalidateListeSnapshot();
  seedNewBundles(dedupedBundles);
  notify();
}

async function processThreadRepliesForViewingConfirmationsAsync(
  newBundles: GmailVorgangBundle[],
  existingVorgaenge: Vorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): Promise<void> {
  for (const bundle of newBundles) {
    if (!bundle.message.threadId) continue;

    const parent =
      existingVorgaenge.find(
        (item) => item.threadId === bundle.message.threadId
      ) ?? bundle.liste;

    const workspace =
      workspaces[parent.id] ??
      workspaces[bundle.liste.id] ??
      findWorkspaceForRequest(parent.id, existingVorgaenge, workspaces);

    if (!workspace) continue;

    if (isAppointmentVorgang(workspace, parent)) {
      await loadAppointmentSuggestionForWorkspace(workspace, parent);
    }

    processViewingConfirmationFromMessage(bundle.message, workspace, parent);
  }
}

function mergeBundlesIntoCache(newBundles: GmailVorgangBundle[]): Vorgang[] {
  if (newBundles.length === 0) return [];

  hydrateFromSession();

  const existingVorgaenge = cache?.vorgaenge ?? [];

  const existingKeysBefore = new Set(
    (cache?.vorgaenge ?? []).map((item) => getVorgangDedupeKey(item))
  );

  const incomingListe = deduplicateBundles(newBundles).map((bundle) => bundle.liste);
  const combined = [...incomingListe, ...(cache?.vorgaenge ?? [])];
  const { vorgaenge: uniqueVorgaenge } = deduplicateVorgaenge(combined);

  const newMessageIds = newBundles.map((bundle) => bundle.message.id);
  const mergedProcessedIds = [
    ...new Set([
      ...(cache?.processedMessageIds ?? []),
      ...newMessageIds,
      ...collectProcessedMessageIds(uniqueVorgaenge),
    ]),
  ];

  const workspaceUpdates = Object.fromEntries(
    deduplicateBundles(newBundles).map((bundle) => [
      bundle.liste.id,
      { ...bundle.workspace, id: bundle.liste.id },
    ])
  );

  const mergedWorkspaces = reindexWorkspacesForVorgaenge(
    uniqueVorgaenge,
    combined,
    {
      ...(cache?.workspaces ?? {}),
      ...workspaceUpdates,
    }
  );

  cache = {
    vorgaenge: applyCompletionStateToAll(uniqueVorgaenge),
    workspaces: mergedWorkspaces,
    loadedAt: new Date().toISOString(),
    processedMessageIds: mergedProcessedIds,
  };

  persistToSession();
  invalidateListeSnapshot();

  const addedVorgaenge = uniqueVorgaenge.filter(
    (item) => !existingKeysBefore.has(getVorgangDedupeKey(item))
  );

  if (addedVorgaenge.length > 0 || newMessageIds.length > 0) {
    seedNewBundles(deduplicateBundles(newBundles));
  }

  notify();

  void processThreadRepliesForViewingConfirmationsAsync(
    deduplicateBundles(newBundles),
    cache.vorgaenge,
    cache.workspaces
  ).then(() => notify());

  return addedVorgaenge;
}

export function subscribeGmailVorgaenge(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasGmailVorgaenge(): boolean {
  hydrateFromSession();
  return (cache?.vorgaenge.length ?? 0) > 0;
}

export function getGmailVorgaenge(): Vorgang[] {
  hydrateFromSession();
  const raw = cache?.vorgaenge.map((item) => resolveListeSnapshot(item)) ?? [];
  return filterVisibleVorgaenge(deduplicateVorgaenge(raw).vorgaenge);
}

/** Markiert einen Vorgang in der Gmail-Liste als erledigt (ohne Löschen). */
export function markVorgangErledigtInStore(vorgangId: string): void {
  hydrateFromSession();
  if (!cache) return;

  cache.vorgaenge = cache.vorgaenge.map((item) => {
    const matches =
      item.id === vorgangId ||
      item.href === `/workspace/${vorgangId}` ||
      resolveVorgangOpenId(item) === vorgangId ||
      (vorgangId.startsWith("thread-") &&
        item.threadId === vorgangId.slice("thread-".length));

    if (!matches) {
      return item;
    }
    return { ...item, status: "erledigt" };
  });

  persistToSession();
  invalidateListeSnapshot(vorgangId);
  notify();
}

/** Setzt Erledigt-Markierung in der Gmail-Liste zurück (Undo). */
export function revertVorgangErledigtInStore(vorgangId: string): void {
  hydrateFromSession();
  if (!cache) return;

  cache.vorgaenge = cache.vorgaenge.map((item) => {
    const matches =
      item.id === vorgangId ||
      item.href === `/workspace/${vorgangId}` ||
      resolveVorgangOpenId(item) === vorgangId ||
      (vorgangId.startsWith("thread-") &&
        item.threadId === vorgangId.slice("thread-".length));

    if (!matches) {
      return item;
    }
    return { ...item, status: "neu" as const };
  });

  persistToSession();
  invalidateListeSnapshot(vorgangId);
  notify();
}

export function getGmailVorgaengeCount(): number {
  return getActiveOpenMailCasesCount();
}

export function getGmailWorkspaceVorgang(id: string): WorkspaceVorgang | null {
  hydrateFromSession();
  if (!cache) return null;

  const workspace = findWorkspaceForRequest(
    id,
    cache.vorgaenge,
    cache.workspaces
  );

  return workspace ? { ...workspace } : null;
}

export function getGmailListeVorgang(id: string): Vorgang | null {
  hydrateFromSession();
  if (!cache) return null;

  const match =
    cache.vorgaenge.find((item) => item.id === id) ??
    cache.vorgaenge.find((item) => item.href === `/workspace/${id}`) ??
    cache.vorgaenge.find((item) => resolveVorgangOpenId(item) === id) ??
    (id.startsWith("thread-")
      ? cache.vorgaenge.find(
          (item) => item.threadId === id.slice("thread-".length)
        )
      : undefined) ??
    (id.startsWith("brain-v3-")
      ? cache.vorgaenge.find(
          (item) =>
            item.id === id ||
            item.sourceEventId === id.slice("brain-v3-".length)
        )
      : undefined);

  return match ? resolveListeSnapshot(match) : null;
}

export function isGmailVorgaengeLoading(): boolean {
  return loading;
}

export function isGmailVorgaengeSyncing(): boolean {
  return syncing;
}

export async function loadGmailVorgaenge(
  providerToken: string,
  context: GmailSyncContext = {}
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!providerToken) {
    return { ok: false, error: "Nicht mit Google verbunden" };
  }

  loading = true;
  notify();

  try {
    await ensureCompletedVorgaengeLoaded();
    hydrateFromSession();
    const messages = await fetchRecentGmailMessages(providerToken, 50, {
      ownEmail: context.ownEmail,
    });
    if (messages.length === 0) {
      if (!cache?.vorgaenge.length) {
        cache = {
          vorgaenge: [],
          workspaces: {},
          loadedAt: new Date().toISOString(),
          processedMessageIds: [],
        };
        persistToSession();
      }
      return { ok: true, count: cache?.vorgaenge.length ?? 0 };
    }

    hydrateFromSession();
    const bundles = buildBundlesFromMessages(messages, context);

    if (cache?.vorgaenge.length) {
      mergeBundlesIntoCache(bundles);
    } else {
      applyCacheFromBundles(bundles);
    }

    const threadIds = [
      ...new Set(
        (cache?.vorgaenge ?? [])
          .map((item) => item.threadId)
          .filter((threadId): threadId is string => Boolean(threadId))
      ),
    ];
    await applyThreadStatusToCache(providerToken, threadIds, context, messages);

    backfillGmailVorgaengeMailMetadata(messages, context);

    return { ok: true, count: cache?.vorgaenge.length ?? bundles.length };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gmail konnte nicht geladen werden.";
    return { ok: false, error: message };
  } finally {
    loading = false;
    notify();
  }
}

export type GmailIncrementalSyncResult =
  | {
      ok: true;
      newCount: number;
      newVorgaenge: Vorgang[];
      skipped?: boolean;
    }
  | { ok: false; error: string };

/** Prüft nur neue Gmail-Nachrichten und erzeugt Diff-Updates für neue Vorgänge. */
export async function syncGmailVorgaengeIncremental(
  providerToken: string,
  context: GmailSyncContext = {}
): Promise<GmailIncrementalSyncResult> {
  if (!providerToken && !context.prefetchedMessages) {
    return { ok: false, error: "Nicht mit Google verbunden" };
  }

  if (syncing) {
    return { ok: true, newCount: 0, newVorgaenge: [], skipped: true };
  }

  syncing = true;
  notify();

  try {
    await ensureCompletedVorgaengeLoaded();
    const messages =
      context.prefetchedMessages ??
      (await fetchRecentGmailMessages(providerToken, 50, {
        ownEmail: context.ownEmail,
      }));
    console.log("[HELPY Gmail Auto Sync] Gefundene Gmail Messages:", messages.length);

    const knownIds = getKnownMessageIds();
    const newMessages = messages.filter((message) => !knownIds.has(message.id));
    console.log("[HELPY Gmail Auto Sync] Neue Gmail Nachrichten:", newMessages.length);

    if (newMessages.length === 0) {
      const backfilled = backfillGmailVorgaengeMailMetadata(messages, context);
      if (backfilled) notify();
      return { ok: true, newCount: 0, newVorgaenge: [] };
    }

    const bundles = buildBundlesFromMessages(newMessages, context);
    const newVorgaenge = mergeBundlesIntoCache(bundles);

    backfillGmailVorgaengeMailMetadata(messages, context);

    if (providerToken) {
      const affectedThreadIds = [
        ...new Set(
          newMessages
            .map((message) => message.threadId)
            .filter((threadId): threadId is string => Boolean(threadId))
        ),
      ];
      await applyThreadStatusToCache(
        providerToken,
        affectedThreadIds,
        context,
        messages
      );
    }

    console.log("[HELPY Gmail Auto Sync] Neue Vorgänge:", newVorgaenge.length);

    return {
      ok: true,
      newCount: newVorgaenge.length,
      newVorgaenge,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gmail konnte nicht synchronisiert werden.";
    return { ok: false, error: message };
  } finally {
    syncing = false;
    notify();
  }
}

export function clearGmailVorgaengeCache(): void {
  cache = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}

let bootstrapped = false;

function bootstrapFromSession(): void {
  if (typeof window === "undefined" || bootstrapped || !cache || cache.vorgaenge.length === 0) {
    return;
  }

  bootstrapped = true;
  seedGmailVorgangStatusesSilent(cache.vorgaenge);
  seedHelpyDecisionsFromListeVorgaenge(cache.vorgaenge);
  seedReplyDraftsFromListeVorgaenge(cache.vorgaenge);
  seedArchivePreparationsFromListeVorgaenge(cache.vorgaenge);
  seedKundenaktenFromListeVorgaenge(cache.vorgaenge, cache.workspaces);
  seedRealEstateObjectsFromListeVorgaenge(cache.vorgaenge, cache.workspaces);
  seedPipelineFromListeVorgaenge(cache.vorgaenge, cache.workspaces);
  bootstrapCustomerMemoryFromGmailCache(cache.vorgaenge, cache.workspaces);
}
