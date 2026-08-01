import { buildPayloadFromPreparedDocument } from "@/features/documents/pdf/payload-builders";
import {
  generateDocumentPreviewSections,
  type CreateDocumentKind,
} from "@/features/documents/services/document-text-generator";
import { prepareExposeFromVorgang } from "@/features/documents/services/vorgang-expose-engine";
import type { PreparedDocument } from "@/features/documents/services/types";
import { readPlatformContextValue } from "@/features/brain/services/platform-inquiry-context";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { HELPY_PREPARED_LABEL } from "@/features/review/services/safety/review-mode";
import { resolveVorgangSender } from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

const TYPE_META: Record<
  CreateDocumentKind,
  { typeId: PreparedDocument["typeId"]; typeLabel: string; titlePrefix: string }
> = {
  expose: { typeId: "expose", typeLabel: "Exposé", titlePrefix: "Exposé" },
  offerte: { typeId: "offerte", typeLabel: "Offerte", titlePrefix: "Offerte" },
  angebot: { typeId: "angebot", typeLabel: "Angebot", titlePrefix: "Angebot" },
};

function resolveSkill(vorgang: Vorgang): PreparedDocument["skill"] {
  if (
    vorgang.skill === "real-estate" ||
    vorgang.skill === "construction" ||
    vorgang.skill === "consulting-legal"
  ) {
    return vorgang.skill;
  }
  return "real-estate";
}

export function resolveDocumentObject(
  vorgang: Vorgang,
  objectOverride?: RealEstateObject | null
): RealEstateObject | null {
  return objectOverride ?? peekRealEstateObjectByVorgangId(vorgang.id);
}

export function prepareDocumentFromVorgang(input: {
  kind: CreateDocumentKind;
  vorgang: Vorgang;
  object?: RealEstateObject | null;
  recipientName?: string;
  recipientEmail?: string;
  sections?: PreparedDocument["previewSections"];
}): PreparedDocument {
  if (input.kind === "expose" && !input.sections) {
    const base = prepareExposeFromVorgang(input.vorgang);
    const object = resolveDocumentObject(input.vorgang, input.object);
    const sections = generateDocumentPreviewSections({
      kind: "expose",
      vorgang: input.vorgang,
      object,
    });
    return {
      ...base,
      previewSections: sections,
      objectId: object?.objectId ?? base.objectId,
      links: {
        ...base.links,
        objectId: object?.objectId,
        objectTitle: object?.titel,
        customerName: input.recipientName ?? base.customer,
        customerEmail: input.recipientEmail ?? base.links?.customerEmail,
      },
    };
  }

  const meta = TYPE_META[input.kind];
  const sender = resolveVorgangSender(input.vorgang);
  const object = resolveDocumentObject(input.vorgang, input.object);
  const objektLabel =
    readPlatformContextValue(input.vorgang.detectedContext, "Objekt") ??
    object?.titel ??
    input.vorgang.titel;
  const customer = input.recipientName?.trim() || sender.name;
  const customerEmail =
    input.recipientEmail?.trim() ||
    readPlatformContextValue(input.vorgang.detectedContext, "E-Mail") ||
    sender.email ||
    undefined;

  const sections =
    input.sections ??
    generateDocumentPreviewSections({
      kind: input.kind,
      vorgang: input.vorgang,
      object,
    });

  const document: PreparedDocument = {
    id: `${input.kind}-${input.vorgang.id}`,
    typeId: meta.typeId,
    skill: resolveSkill(input.vorgang),
    typeLabel: meta.typeLabel,
    title: `${meta.titlePrefix} — ${objektLabel}`,
    customer,
    vorgangId: input.vorgang.id,
    vorgangTitle: input.vorgang.titel,
    objectId: object?.objectId,
    links: {
      objectId: object?.objectId,
      objectTitle: object?.titel,
      customerName: customer,
      customerEmail,
    },
    status: "zur-pruefung",
    category: "helpy-vorbereitet",
    lastEdited: new Date().toLocaleDateString("de-CH"),
    helpyHint: HELPY_PREPARED_LABEL,
    preparedByHelpy: true,
    previewSections: sections,
  };

  const payload = buildPayloadFromPreparedDocument(document);
  return payload ? { ...document, pdfPayload: payload } : document;
}
