import {
  getDbListeVorgang,
  getDbVorgaenge,
  getDbWorkspaceVorgang,
  subscribeDbVorgaenge,
} from "@/features/vorgaenge/services/db-vorgaenge-store";
import {
  getGmailListeVorgang,
  getGmailVorgaenge,
  getGmailWorkspaceVorgang,
  subscribeGmailVorgaenge,
} from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import {
  getOutlookListeVorgang,
  getOutlookVorgaenge,
  getOutlookWorkspaceVorgang,
  subscribeOutlookVorgaenge,
} from "@/features/outlook/services/outlook-vorgaenge-store";
import {
  getVoiceListeVorgang,
  getVoiceVorgaenge,
  getVoiceWorkspaceVorgang,
  subscribeVoiceVorgaenge,
} from "@/features/voice/services/voice-vorgaenge-store";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import {
  deduplicateVorgaenge,
  sortDeduplicatedVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import { filterVisibleVorgaenge } from "@/features/workspace/services/vorgang-visibility-store";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

/** Kombiniert Gmail-, Outlook- und Telefon-Vorgänge ohne Duplikate. */
export function getAllMailVorgaenge(): Vorgang[] {
  const combined = [
    ...getGmailVorgaenge(),
    ...getOutlookVorgaenge(),
    ...getVoiceVorgaenge(),
    ...getDbVorgaenge(),
  ];
  const { vorgaenge } = deduplicateVorgaenge(combined);
  return filterVisibleVorgaenge(sortDeduplicatedVorgaenge(vorgaenge));
}

export function subscribeAllMailVorgaenge(listener: () => void): () => void {
  const unsubs = [
    subscribeGmailVorgaenge(listener),
    subscribeOutlookVorgaenge(listener),
    subscribeVoiceVorgaenge(listener),
    subscribeDbVorgaenge(listener),
  ];
  return () => unsubs.forEach((unsub) => unsub());
}

export function hasAnyMailVorgaenge(): boolean {
  return getAllMailVorgaenge().length > 0;
}

/** Alias für provider-neutrale UI-Schicht. */
export const hasMailVorgaenge = hasAnyMailVorgaenge;

export function getMailListeVorgang(id: string): Vorgang | null {
  return (
    getGmailListeVorgang(id) ??
    getOutlookListeVorgang(id) ??
    getVoiceListeVorgang(id) ??
    getDbListeVorgang(id)
  );
}

export function getMailWorkspaceVorgang(id: string): WorkspaceVorgang | null {
  return (
    getGmailWorkspaceVorgang(id) ??
    getOutlookWorkspaceVorgang(id) ??
    getVoiceWorkspaceVorgang(id) ??
    getDbWorkspaceVorgang(id)
  );
}
