import {
  getBackgroundMemoryWorkspaceHints,
} from "@/features/memory/services/background-memory-engine";
import type {
  BackgroundMemoryHint,
  BackgroundMemoryWorkspaceContext,
} from "@/features/memory/types/memory-types";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export const EMPTY_BACKGROUND_MEMORY_HINTS: readonly BackgroundMemoryHint[] =
  Object.freeze([]);

type CachedHints = {
  cacheKey: string;
  value: readonly BackgroundMemoryHint[];
};

const snapshots = new Map<string, CachedHints>();

function extractEmail(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): string {
  const from = liste?.from ?? vorgang.letzteEmail.absender;
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  if (from.includes("@")) return from.trim();
  return vorgang.kunde.email !== "—" ? vorgang.kunde.email : "";
}

function extractName(vorgang: WorkspaceVorgang): string {
  return (
    vorgang.kunde.ansprechpartner ||
    vorgang.kunde.firmenname ||
    vorgang.kunde.email
  );
}

function buildCacheKey(context: BackgroundMemoryWorkspaceContext): string {
  return [
    context.vorgangId,
    context.customerEmail ?? "",
    context.objectId ?? "",
    context.hasAppointmentFlow ? "1" : "0",
    context.hasReplyDraft ? "1" : "0",
  ].join("::");
}

export function buildBackgroundMemoryWorkspaceContext(input: {
  vorgang: WorkspaceVorgang;
  liste?: ListeVorgang;
  hasAppointmentFlow?: boolean;
  hasReplyDraft?: boolean;
}): BackgroundMemoryWorkspaceContext {
  const object =
    peekRealEstateObjectByVorgangId(input.vorgang.id) ??
    (input.vorgang as WorkspaceVorgang & { objectId?: string });

  return {
    vorgangId: input.vorgang.id,
    customerEmail: extractEmail(input.vorgang, input.liste),
    customerName: extractName(input.vorgang),
    objectId: object?.objectId ?? null,
    hasAppointmentFlow: input.hasAppointmentFlow ?? false,
    hasReplyDraft: input.hasReplyDraft ?? false,
  };
}

export function getBackgroundMemoryWorkspaceHintsSnapshot(input: {
  vorgang: WorkspaceVorgang;
  liste?: ListeVorgang;
  hasAppointmentFlow?: boolean;
  hasReplyDraft?: boolean;
}): readonly BackgroundMemoryHint[] {
  const context = buildBackgroundMemoryWorkspaceContext(input);
  const cacheKey = buildCacheKey(context);
  const cached = snapshots.get(context.vorgangId);

  if (cached?.cacheKey === cacheKey) {
    return cached.value;
  }

  const hints = getBackgroundMemoryWorkspaceHints(context);
  const value =
    hints.length > 0
      ? (Object.freeze([...hints]) as readonly BackgroundMemoryHint[])
      : EMPTY_BACKGROUND_MEMORY_HINTS;

  snapshots.set(context.vorgangId, { cacheKey, value });
  return value;
}

export function getBackgroundMemoryWorkspaceHintsServerSnapshot(): readonly BackgroundMemoryHint[] {
  return EMPTY_BACKGROUND_MEMORY_HINTS;
}

export function invalidateBackgroundMemoryWorkspaceSnapshots(): void {
  snapshots.clear();
}
