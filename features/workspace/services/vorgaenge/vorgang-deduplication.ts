import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import type { ReplyDraftStatus } from "@/features/reply-drafts/types/reply-draft-types";
import { getVorgangStatusSnapshot } from "@/features/workspace/services/status/status-engine";
import type { HelpyVorgangStatus } from "@/features/workspace/services/status/types";
import {
  shouldSuppressReopenedVorgang,
  isVorgangCompleted,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import type { Vorgang, VorgangPriority, VorgangStatus } from "@/features/workspace/services/vorgaenge/types";
import { isHelpyPhoneVorgang } from "@/features/voice/services/helpy-phone-detector";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import { mergeThreadAttachments } from "@/features/mail/services/mail-attachment-mapper";

const PRIORITY_RANK: Record<VorgangPriority, number> = {
  kritisch: 0,
  hoch: 1,
  mittel: 2,
  niedrig: 3,
};

const HELPY_STATUS_RANK: Record<HelpyVorgangStatus, number> = {
  erledigt: 0,
  bestaetigt: 1,
  "in-pruefung": 2,
  "wartet-auf-rueckmeldung": 3,
  "von-helpy-vorbereitet": 4,
  neu: 5,
};

const REPLY_DRAFT_STATUS_RANK: Record<ReplyDraftStatus, number> = {
  uebernommen: 0,
  bestaetigt: 1,
  bearbeitet: 2,
  vorbereitet: 3,
};

export type VorgangDedupeStats = {
  workspaceCount: number;
  mergedCount: number;
  duplicateThreads: number;
  afterMergeCount: number;
};

function getReceivedTimestamp(vorgang: Vorgang): number {
  const raw = vorgang.emailDate ?? vorgang.receivedAt;
  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Eindeutiger Schlüssel pro Workspace-Vorgang. */
export function getVorgangDedupeKey(vorgang: Vorgang): string {
  if (isHelpyPhoneVorgang(vorgang)) {
    return `helpy_phone:${vorgang.id}`;
  }

  if (vorgang.quelle === "Manuell") {
    return `manuell:${vorgang.id}`;
  }

  const provider = vorgang.mailProvider ?? (vorgang.quelle === "Outlook" ? "outlook" : "gmail");

  if (vorgang.threadId) {
    return `${provider}:thread:${vorgang.threadId}`;
  }

  const messageId = vorgang.sourceEventId ?? vorgang.id;
  return `${provider}:message:${messageId}`;
}

function pickHighestPriority(items: Vorgang[]): VorgangPriority {
  return items.reduce((best, item) =>
    PRIORITY_RANK[item.prioritaet] < PRIORITY_RANK[best.prioritaet]
      ? item
      : best
  ).prioritaet;
}

function pickMostAdvancedStatus(items: Vorgang[]): Vorgang {
  return items.reduce((best, item) => {
    const bestRank = HELPY_STATUS_RANK[getVorgangStatusSnapshot(best).currentStatus];
    const itemRank = HELPY_STATUS_RANK[getVorgangStatusSnapshot(item).currentStatus];
    return itemRank < bestRank ? item : best;
  });
}

function pickCanonicalVorgang(items: Vorgang[]): Vorgang {
  const withDrafts = items
    .map((item) => ({ item, draft: getReplyDraft(item.id) }))
    .filter((entry): entry is { item: Vorgang; draft: NonNullable<ReturnType<typeof getReplyDraft>> } =>
      Boolean(entry.draft)
    );

  if (withDrafts.length > 0) {
    return withDrafts
      .sort((a, b) => {
        const statusDiff =
          REPLY_DRAFT_STATUS_RANK[a.draft.status] -
          REPLY_DRAFT_STATUS_RANK[b.draft.status];
        if (statusDiff !== 0) return statusDiff;
        return getReceivedTimestamp(b.item) - getReceivedTimestamp(a.item);
      })[0].item;
  }

  return [...items].sort(
    (a, b) => getReceivedTimestamp(b) - getReceivedTimestamp(a)
  )[0];
}

function resolveMergedStatus(group: Vorgang[], newest: Vorgang): VorgangStatus {
  if (shouldSuppressReopenedVorgang(newest)) {
    return "erledigt";
  }

  if (newest.latestMessageDirection === "outgoing") {
    return "wartend";
  }

  const hadCompleted =
    group.some((item) => item.status === "erledigt" || isVorgangCompleted(item));

  if (hadCompleted) {
    return "neu";
  }

  return newest.status;
}

/** Führt mehrere Vorgänge derselben Unterhaltung zu einem zusammen. */
export function mergeVorgaengeGroup(group: Vorgang[]): Vorgang {
  if (group.length <= 1) {
    return group[0];
  }

  const canonical = pickCanonicalVorgang(group);
  const newest = [...group].sort(
    (a, b) => getReceivedTimestamp(b) - getReceivedTimestamp(a)
  )[0];
  const resolvedId =
    canonical.id?.trim() ||
    newest.id?.trim() ||
    (canonical.sourceEventId
      ? canonical.sourceEventId.startsWith("brain-v3-")
        ? canonical.sourceEventId
        : `brain-v3-${canonical.sourceEventId}`
      : newest.sourceEventId
        ? newest.sourceEventId.startsWith("brain-v3-")
          ? newest.sourceEventId
          : `brain-v3-${newest.sourceEventId}`
        : canonical.threadId
          ? `thread-${canonical.threadId}`
          : newest.id);

  return {
    ...canonical,
    id: resolvedId,
    prioritaet:
      newest.latestMessageDirection === "outgoing"
        ? "niedrig"
        : pickHighestPriority(group),
    status: resolveMergedStatus(group, newest),
    titel: newest.titel,
    summary: newest.summary ?? canonical.summary,
    helpyEmpfehlung: newest.helpyEmpfehlung ?? canonical.helpyEmpfehlung,
    helpyMessage: newest.helpyMessage ?? canonical.helpyMessage,
    recommendedNextStep:
      newest.recommendedNextStep ?? canonical.recommendedNextStep,
    receivedAt: newest.receivedAt,
    receivedLabel: newest.receivedLabel,
    emailDate: newest.emailDate,
    snippet: newest.snippet ?? canonical.snippet,
    latestMessageDirection:
      newest.latestMessageDirection ?? canonical.latestMessageDirection,
    latestMessageFrom: newest.latestMessageFrom ?? canonical.latestMessageFrom,
    latestMessageAt: newest.latestMessageAt ?? canonical.latestMessageAt,
    hasUnreadExternalMessage:
      newest.hasUnreadExternalMessage ?? canonical.hasUnreadExternalMessage,
    href: canonical.href ?? newest.href ?? `/workspace/${resolvedId}`,
    mailProvider: newest.mailProvider ?? canonical.mailProvider,
    mailConnectionId: newest.mailConnectionId ?? canonical.mailConnectionId,
    mailAttachments: mergeMailAttachmentsForGroup(group),
  };
}

function mergeMailAttachmentsForGroup(group: Vorgang[]): UnifiedMailAttachment[] | undefined {
  const merged = mergeThreadAttachments(
    group.flatMap((item) => [...(item.mailAttachments ?? [])])
  );
  return merged.length > 0 ? merged : undefined;
}

export function sortDeduplicatedVorgaenge(vorgaenge: Vorgang[]): Vorgang[] {
  return [...vorgaenge].sort((a, b) => {
    const priorityDiff =
      PRIORITY_RANK[a.prioritaet] - PRIORITY_RANK[b.prioritaet];
    if (priorityDiff !== 0) return priorityDiff;
    return getReceivedTimestamp(b) - getReceivedTimestamp(a);
  });
}

export function deduplicateVorgaenge(
  vorgaenge: Vorgang[],
  options?: { debug?: boolean }
): { vorgaenge: Vorgang[]; stats: VorgangDedupeStats } {
  const groups = new Map<string, Vorgang[]>();

  for (const vorgang of vorgaenge) {
    const key = getVorgangDedupeKey(vorgang);
    const group = groups.get(key) ?? [];
    group.push(vorgang);
    groups.set(key, group);
  }

  let duplicateThreads = 0;
  let mergedCount = 0;
  const merged: Vorgang[] = [];

  for (const group of groups.values()) {
    if (group.length > 1) {
      duplicateThreads += 1;
      mergedCount += group.length - 1;
    }
    merged.push(mergeVorgaengeGroup(group));
  }

  const sorted = sortDeduplicatedVorgaenge(merged);
  const stats: VorgangDedupeStats = {
    workspaceCount: vorgaenge.length,
    mergedCount,
    duplicateThreads,
    afterMergeCount: sorted.length,
  };

  if (options?.debug && typeof window !== "undefined" && stats.mergedCount > 0) {
    // Dedup stats available via return value — no console output in MVP.
  }

  return { vorgaenge: sorted, stats };
}
