import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { isNonServiceInquiry } from "@/features/spam-handling/services/spam-detection";
import type {
  ArchivePreparation,
  ArchivePreparationInput,
  ArchivePreparationStatus,
} from "@/features/spam-handling/types/archive-types";
import type { HelpyReview } from "@/features/review/services/types";
import {
  HELPY_ARCHIVE_RECOMMENDATION,
  HELPY_ARCHIVE_STATUS_CONFIRMED,
  HELPY_ARCHIVE_STATUS_PREPARED,
  HELPY_BUTTON_ARCHIVIERUNG_BESTAETIGEN,
  HELPY_PREPARED_LABEL,
} from "@/features/review/services/safety/review-mode";
import { REVIEW_CONFIRM_MESSAGE } from "@/features/review/services/types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const preparations = new Map<string, ArchivePreparation>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function statusLabelFor(status: ArchivePreparationStatus): string {
  return status === "archivierung_bestaetigt"
    ? HELPY_ARCHIVE_STATUS_CONFIRMED
    : HELPY_ARCHIVE_STATUS_PREPARED;
}

function buildArchivePreparation(
  input: ArchivePreparationInput,
  status: ArchivePreparationStatus = "zum_archivieren_vorbereitet"
): ArchivePreparation {
  return {
    id: `archive-prep-${input.vorgangId}`,
    vorgangId: input.vorgangId,
    recommendation: HELPY_ARCHIVE_RECOMMENDATION,
    statusLabel: statusLabelFor(status),
    status,
    needsConfirmation: true,
  };
}

export function subscribeArchivePreparation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function buildArchiveInputFromListe(
  vorgang: ListeVorgang
): ArchivePreparationInput {
  return {
    vorgangId: vorgang.id,
    subject: vorgang.titel,
    sender: vorgang.from ?? vorgang.kunde,
    summary: vorgang.summary,
  };
}

function isPlatformRealEstateInquiry(vorgang: ListeVorgang): boolean {
  return (
    vorgang.typ === "anfrage" &&
    isPlatformRealEstateQuelle(vorgang.quelle)
  );
}

export function shouldPrepareArchive(vorgang: ListeVorgang): boolean {
  if (isPlatformRealEstateInquiry(vorgang)) {
    return false;
  }

  if (
    vorgang.intent === "spam_newsletter" ||
    vorgang.intentLabel === "Spam / Newsletter"
  ) {
    return true;
  }

  return isNonServiceInquiry({
    intent: vorgang.intent,
    intentLabel: vorgang.intentLabel,
    titel: vorgang.titel,
    snippet: vorgang.snippet,
    summary: vorgang.summary,
    from: vorgang.from,
    brainIntent: vorgang.intentLabel,
  });
}

export function shouldPrepareArchiveForWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): boolean {
  if (liste) return shouldPrepareArchive(liste);

  return isNonServiceInquiry({
    intent: vorgang.aufgabe.kategorie,
    intentLabel: vorgang.kopfzeile?.intentLabel ?? vorgang.aufgabe.kategorie,
    titel: vorgang.aufgabe.titel,
    snippet: vorgang.letzteEmail.inhalt,
    summary: vorgang.letzteEmail.zusammenfassung,
    from: vorgang.letzteEmail.absender,
  });
}

export function prepareArchiveForVorgang(
  vorgang: ListeVorgang
): ArchivePreparation | null {
  if (!shouldPrepareArchive(vorgang)) return null;

  const existing = preparations.get(vorgang.id);
  const preparation = buildArchivePreparation(
    buildArchiveInputFromListe(vorgang),
    existing?.status ?? "zum_archivieren_vorbereitet"
  );

  preparations.set(vorgang.id, preparation);
  notify();
  return preparation;
}

export function getArchivePreparation(vorgangId: string): ArchivePreparation | null {
  return preparations.get(vorgangId) ?? null;
}

export function getOrPrepareArchive(vorgang: ListeVorgang): ArchivePreparation | null {
  const existing = getArchivePreparation(vorgang.id);
  if (existing) return existing;
  if (!shouldPrepareArchive(vorgang)) return null;

  return storeArchivePreparationSilently(
    buildArchivePreparation(buildArchiveInputFromListe(vorgang))
  );
}

function storeArchivePreparationSilently(
  preparation: ArchivePreparation
): ArchivePreparation {
  preparations.set(preparation.vorgangId, preparation);
  return preparation;
}

export function getOrPrepareArchiveForWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): ArchivePreparation | null {
  if (liste) return getOrPrepareArchive(liste);
  if (!shouldPrepareArchiveForWorkspace(vorgang)) return null;

  const existing = getArchivePreparation(vorgang.id);
  if (existing) return existing;

  return storeArchivePreparationSilently(
    buildArchivePreparation({
      vorgangId: vorgang.id,
      subject: vorgang.aufgabe.titel,
      sender: vorgang.letzteEmail.absender,
      summary: vorgang.letzteEmail.zusammenfassung,
    })
  );
}

export function confirmArchivePreparation(vorgangId: string): ArchivePreparation | null {
  const existing = preparations.get(vorgangId);
  if (!existing) return null;

  const updated: ArchivePreparation = {
    ...existing,
    status: "archivierung_bestaetigt",
    statusLabel: HELPY_ARCHIVE_STATUS_CONFIRMED,
  };

  preparations.set(vorgangId, updated);
  notify();
  return updated;
}

export function createReviewForArchive(
  preparation: ArchivePreparation
): HelpyReview {
  return {
    id: `review-${preparation.id}`,
    instanceId: preparation.id,
    actionTypeId: "antwort-vorbereiten",
    actionTitle: "Archivierung von HELPY vorbereitet",
    title: "Archivierung prüfen",
    helpyHint: HELPY_PREPARED_LABEL,
    content: {
      kind: "allgemein",
      zusammenfassung:
        preparation.recommendation ||
        "HELPY empfiehlt, diese Nachricht zu archivieren.",
      details: [],
      primaryLabel: HELPY_BUTTON_ARCHIVIERUNG_BESTAETIGEN,
    },
  };
}

export function getArchiveConfirmMessage(): string {
  return REVIEW_CONFIRM_MESSAGE;
}

export function seedArchivePreparationsFromBundles(
  bundles: GmailVorgangBundle[]
): void {
  for (const bundle of bundles) {
    if (shouldPrepareArchive(bundle.liste)) {
      prepareArchiveForVorgang(bundle.liste);
    }
  }
}

export function seedArchivePreparationsFromListeVorgaenge(
  vorgaenge: ListeVorgang[]
): void {
  for (const vorgang of vorgaenge) {
    if (vorgang.quelle === "Gmail") {
      prepareArchiveForVorgang(vorgang);
    }
  }
}

export function resetArchivePreparationStore(): void {
  preparations.clear();
  notify();
}
