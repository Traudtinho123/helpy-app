import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import {
  buildKundenakteMatchKey,
  findMatchingKundenakte,
} from "@/features/kundenakte/services/kundenakte-deduplication";
import {
  buildExtractInputFromBundle,
  buildExtractInputFromWorkspace,
  extractKundenakteFields,
} from "@/features/kundenakte/services/kundenakte-extractor";
import {
  getAllKundenakten,
  peekKundenakteByVorgangId,
  upsertKundenakte,
} from "@/features/kundenakte/services/kundenakte-store";
import {
  recordKundenakteConfirmed,
  recordKundenaktePrepared,
} from "@/features/kundenakte/services/kundenakte-timeline";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { KUNDENAKTE_STATUS_LABELS } from "@/features/kundenakte/types/kundenakte-types";
import type { HelpyReview } from "@/features/review/services/types";
import {
  HELPY_PREPARED_LABEL,
} from "@/features/review/services/safety/review-mode";
import { REVIEW_CONFIRM_MESSAGE } from "@/features/review/services/types";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export const HELPY_KUNDENAKTE_CARD_TITLE = "Kundenakte von HELPY vorbereitet";
export const HELPY_KUNDENAKTE_HINT =
  "Ich habe diesen Kontakt erkannt und die Kundenakte vorbereitet. Bitte prüfe die Angaben.";
export const HELPY_KNOWN_CUSTOMER_LABEL = "Bekannter Kunde erkannt";
export const HELPY_BUTTON_KUNDENAKTE_PRUEFEN = "Kundenakte prüfen";
export const HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN = "Kundenakte bestätigen";

function isRealCustomerInquiry(liste?: ListeVorgang): boolean {
  if (!liste) return true;
  return !shouldPrepareArchive(liste);
}

function buildKundenakteRecord(
  input: ReturnType<typeof extractKundenakteFields> & {
    vorgangId: string;
    receivedAt: string;
    receivedLabel: string;
  },
  existing: Kundenakte | null,
  quelle = "Gmail"
): Kundenakte | null {
  if (!input.email || input.email === "—") return null;

  const knownMatch = findMatchingKundenakte(
    getAllKundenakten().filter((item) => item.vorgangId !== input.vorgangId),
    {
      email: input.email,
      firma: input.firma,
      name: input.name,
    }
  );

  const isKnownCustomer = Boolean(
    knownMatch && knownMatch.vorgangId !== input.vorgangId
  );

  const id =
    knownMatch?.id ??
    buildKundenakteMatchKey({
      email: input.email,
      firma: input.firma,
      name: input.name,
    });

  const preservedStatus =
    existing?.status === "bestaetigt"
      ? "bestaetigt"
      : existing?.status === "bearbeitet"
        ? "bearbeitet"
        : "vorbereitet";

  return {
    id,
    vorgangId: input.vorgangId,
    name: existing?.name ?? input.name,
    firma: existing?.firma ?? input.firma,
    email: existing?.email ?? input.email,
    telefon: existing?.telefon ?? input.telefon,
    adresse: existing?.adresse ?? input.adresse,
    quelle,
    skill: input.skill,
    skillLabel: input.skillLabel,
    letzterKontakt: input.receivedAt,
    letzterKontaktLabel: input.receivedLabel,
    betreff: existing?.betreff ?? input.betreff,
    zusammenfassung: existing?.zusammenfassung ?? input.zusammenfassung,
    status: preservedStatus,
    statusLabel: KUNDENAKTE_STATUS_LABELS[preservedStatus],
    isKnownCustomer,
    helpyHint: isKnownCustomer
      ? `${HELPY_KNOWN_CUSTOMER_LABEL}. ${HELPY_KUNDENAKTE_HINT}`
      : HELPY_KUNDENAKTE_HINT,
  };
}

export function prepareKundenakteFromBundle(
  bundle: GmailVorgangBundle
): Kundenakte | null {
  if (shouldPrepareArchive(bundle.liste)) return null;

  const existing = peekKundenakteByVorgangId(bundle.liste.id);
  const extracted = extractKundenakteFields(buildExtractInputFromBundle(bundle));
  const record = buildKundenakteRecord(
    {
      ...extracted,
      vorgangId: bundle.liste.id,
      receivedAt: bundle.liste.receivedAt,
      receivedLabel: bundle.liste.receivedLabel,
    },
    existing,
    bundle.liste.quelle ?? "Gmail"
  );

  if (!record) return null;

  upsertKundenakte(record);

  if (!existing) {
    recordKundenaktePrepared({
      kundenakteId: record.id,
      vorgangId: record.vorgangId,
      customerName: record.name,
    });
  }

  return record;
}

export function prepareKundenakteFromWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): Kundenakte | null {
  if (!isRealCustomerInquiry(liste)) return null;

  const existing = peekKundenakteByVorgangId(vorgang.id);
  const extracted = extractKundenakteFields(
    buildExtractInputFromWorkspace(vorgang, liste)
  );
  const record = buildKundenakteRecord(
    {
      ...extracted,
      vorgangId: vorgang.id,
      receivedAt: liste?.receivedAt ?? new Date().toISOString(),
      receivedLabel: liste?.receivedLabel ?? vorgang.letzteEmail.datum,
    },
    existing,
    liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail"
  );

  if (!record) return null;

  upsertKundenakte(record);

  if (!existing) {
    recordKundenaktePrepared({
      kundenakteId: record.id,
      vorgangId: record.vorgangId,
      customerName: record.name,
    });
  }

  return record;
}

export function updateKundenakteFields(
  vorgangId: string,
  fields: Partial<
    Pick<Kundenakte, "name" | "firma" | "email" | "telefon" | "adresse">
  >
): Kundenakte | null {
  const existing = peekKundenakteByVorgangId(vorgangId);
  if (!existing || existing.status === "bestaetigt") return existing;

  const updated: Kundenakte = {
    ...existing,
    ...fields,
    status: "bearbeitet",
    statusLabel: KUNDENAKTE_STATUS_LABELS.bearbeitet,
  };

  upsertKundenakte(updated);
  return updated;
}

export function confirmKundenakte(vorgangId: string): Kundenakte | null {
  const existing = peekKundenakteByVorgangId(vorgangId);
  if (!existing) return null;

  const confirmed: Kundenakte = {
    ...existing,
    status: "bestaetigt",
    statusLabel: KUNDENAKTE_STATUS_LABELS.bestaetigt,
  };

  upsertKundenakte(confirmed);
  recordKundenakteConfirmed({
    kundenakteId: confirmed.id,
    vorgangId: confirmed.vorgangId,
  });
  processBackgroundMemoryEvent({
    type: "kundenakte-bestaetigt",
    kundenakte: confirmed,
  });

  return confirmed;
}

export function createReviewForKundenakte(record: Kundenakte): HelpyReview {
  return {
    id: `review-${record.id}`,
    instanceId: record.id,
    actionTypeId: "kunde-anlegen",
    actionTitle: HELPY_KUNDENAKTE_CARD_TITLE,
    title: "Kundenakte prüfen",
    helpyHint: HELPY_PREPARED_LABEL,
    content: {
      kind: "kunde",
      name: record.name,
      firma: record.firma,
      email: record.email,
      telefon: record.telefon,
      primaryLabel: HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN,
    },
  };
}

export function getKundenakteConfirmMessage(): string {
  return `${REVIEW_CONFIRM_MESSAGE} Die Kundenakte ist bestätigt, aber noch nicht endgültig gespeichert.`;
}

export function seedKundenaktenFromBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    prepareKundenakteFromBundle(bundle);
  }
}

export function seedKundenaktenFromListeVorgaenge(
  vorgaenge: ListeVorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): void {
  for (const liste of vorgaenge) {
    const workspace = workspaces[liste.id];
    if (workspace) {
      prepareKundenakteFromWorkspace(workspace, liste);
    }
  }
}
