import { openCreateDocumentModal } from "@/features/documents/services/create-document-modal-store";
import type { CreateDocumentKind } from "@/features/documents/services/document-text-generator";
import { resolveDocumentObject } from "@/features/documents/services/vorgang-document-engine";
import { getMailListeVorgang } from "@/features/mail/unified-mail-source-service";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import { getGmailListeVorgang } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export function createSyntheticVorgangFromObject(
  object: RealEstateObject
): Vorgang {
  return {
    id: `objekt-${object.objectId}`,
    typ: "anfrage",
    intent: "interessentenanfrage",
    intentLabel: "Immobilienanfrage",
    titel: object.titel,
    emoji: "🏠",
    kunde: "Interessent",
    quelle: object.quelle ?? "Objekt",
    prioritaet: "mittel",
    status: "neu",
    summary: object.beschreibung ?? object.titel,
    helpyEmpfehlung: "Exposé erstellen und versenden.",
    receivedAt: new Date().toISOString(),
    receivedLabel: new Date().toLocaleDateString("de-CH"),
    detectedContext: [
      `Objekt: ${object.titel}`,
      `Adresse: ${object.adresse}, ${object.plz} ${object.ort}`,
      `Preis: ${object.preis ?? "Auf Anfrage"}`,
    ],
    skill: "real-estate",
  };
}

export function openDocumentCreationForObject(input: {
  object: RealEstateObject;
  kind: CreateDocumentKind;
}): void {
  openCreateDocumentModal({
    kind: input.kind,
    vorgang: createSyntheticVorgangFromObject(input.object),
    object: input.object,
  });
}

export function resolveListeVorgang(vorgangId: string): Vorgang | null {
  return (
    getMailListeVorgang(vorgangId) ??
    getGmailListeVorgang(vorgangId) ??
    getBrainV2Vorgaenge().find((item) => item.id === vorgangId) ??
    null
  );
}

export function openDocumentCreationForVorgang(input: {
  vorgangId: string;
  kind: CreateDocumentKind;
  objectId?: string;
}): boolean {
  const vorgang = resolveListeVorgang(input.vorgangId);
  if (!vorgang) return false;

  const object =
    (input.objectId ? getRealEstateObjectById(input.objectId) : null) ??
    resolveDocumentObject(vorgang);

  openCreateDocumentModal({
    kind: input.kind,
    vorgang,
    object,
  });
  return true;
}

export function openDocumentCreationForFocus(input: {
  vorgangId: string;
  focus?: string | null;
}): boolean {
  const kind =
    input.focus === "expose"
      ? "expose"
      : input.focus === "offerte"
        ? "offerte"
        : input.focus === "angebot"
          ? "angebot"
          : null;
  if (!kind) return false;
  return openDocumentCreationForVorgang({ vorgangId: input.vorgangId, kind });
}
