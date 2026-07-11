import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  buildRecommendation,
  classifyAttachment,
  extractAttachmentCandidates,
  hasGmailAttachmentSignals,
} from "@/features/documents/intelligence/document-classifier";
import {
  buildAttachmentDedupeKey,
  normalizeFileName,
} from "@/features/documents/intelligence/document-dedupe";
import { resolveDocumentSource } from "@/features/documents/intelligence/document-source";
import type {
  GmailAttachmentCandidate,
  HelpyRecognizedDocument,
  RecognizeDocumentsInput,
  RecognizedDocumentCategory,
} from "@/features/documents/intelligence/document-types";
import { getCategoryLabel } from "@/features/documents/intelligence/document-types";
import {
  findDocumentByDedupeKey,
  upsertPreparedDocument,
} from "@/features/documents/services/document-engine";
import type {
  DocumentTypeId,
  PreparedDocument,
} from "@/features/documents/services/types";
import { buildCustomerIdFromEmail } from "@/features/intelligence/customer-memory/customer-memory-store";
import { appendDocumentIdToObject } from "@/features/real-estate/object/object-link-sync";
import {
  peekRealEstateObjectByVorgangId,
} from "@/features/real-estate/object/object-memory";
import { recordDocumentRecognized } from "@/features/workspace/services/status/status-engine";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import { formatAttachmentSize } from "@/features/mail/services/mail-attachments-client";
import { dedupeUnifiedMailAttachments } from "@/features/mail/services/mail-attachment-mapper";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export const EMPTY_RECOGNIZED_DOCUMENTS: readonly HelpyRecognizedDocument[] =
  Object.freeze([]);

const recognizedDocumentsCache = new Map<
  string,
  { fingerprint: string; value: readonly HelpyRecognizedDocument[] }
>();

function buildInputFingerprint(input: RecognizeDocumentsInput): string {
  return JSON.stringify({
    vorgangId: input.vorgangId,
    skill: input.skill,
    subject: input.subject,
    snippet: input.snippet,
    intentLabel: input.intentLabel ?? null,
    messageId: input.messageId ?? null,
    sourceQuelle: input.sourceQuelle ?? null,
    sourceThreadId: input.sourceThreadId ?? null,
    customerEmail: input.customerEmail ?? null,
    customerName: input.customerName ?? null,
    customerId: input.customerId ?? null,
    objectId: input.objectId ?? null,
    objectTitle: input.objectTitle ?? null,
    vorgangTitle: input.vorgangTitle ?? null,
    mailAttachmentIds: dedupeUnifiedMailAttachments(input.mailAttachments ?? [])
      .map((item) => item.id)
      .sort(),
  });
}

function buildRecognitionDedupeKey(attachment: GmailAttachmentCandidate): string {
  const fileName = normalizeFileName(attachment.fileName);
  if (attachment.sizeBytes && attachment.sizeBytes > 0) {
    return `file:${fileName}:${attachment.sizeBytes}:${attachment.mimeType}`;
  }
  return buildAttachmentDedupeKey({
    fileName: attachment.fileName,
    messageId: attachment.messageId,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    providerAttachmentId: attachment.providerAttachmentId,
  });
}

function unifiedMailAttachmentToCandidate(
  attachment: UnifiedMailAttachment
): GmailAttachmentCandidate {
  return {
    fileName: attachment.name,
    mimeType: attachment.contentType,
    messageId: attachment.providerMessageId,
    providerAttachmentId: attachment.providerAttachmentId,
    direction: attachment.direction,
    messageReceivedAt: attachment.messageReceivedAt,
    messageSubject: attachment.messageSubject,
    sizeBytes: attachment.size,
    sizeLabel: formatAttachmentSize(attachment.size),
  };
}

function resolveAttachmentCandidates(
  input: RecognizeDocumentsInput
): GmailAttachmentCandidate[] {
  const fromMail = dedupeUnifiedMailAttachments(
    input.mailAttachments ?? []
  ).map(unifiedMailAttachmentToCandidate);

  if (fromMail.length > 0) {
    return fromMail;
  }

  const textCandidates = extractAttachmentCandidates(
    input.subject,
    input.snippet,
    input.skill,
    input.intentLabel,
    input.messageId
  );

  const seen = new Set<string>();
  return textCandidates.filter((candidate) => {
    const key = buildRecognitionDedupeKey(candidate);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildAssignedToLabel(input: {
  skill: HelpySkill;
  customerName?: string;
  customerEmail?: string;
  objectTitle?: string | null;
  vorgangTitle?: string;
  vorgangId: string;
  source: ReturnType<typeof resolveDocumentSource>;
}): string {
  const parts: string[] = [];

  if (input.customerName?.trim()) {
    parts.push(`Kunde · ${input.customerName.trim()}`);
  } else if (input.customerEmail?.trim()) {
    parts.push(`Kunde · ${input.customerEmail.trim()}`);
  }

  if (input.objectTitle?.trim()) {
    parts.push(`Objekt · ${input.objectTitle.trim()}`);
  } else if (input.skill === "construction") {
    parts.push(`Baustelle · ${input.vorgangTitle?.trim() || input.vorgangId}`);
  } else if (input.skill === "consulting-legal") {
    parts.push(`Mandat · ${input.vorgangTitle?.trim() || input.vorgangId}`);
  }

  parts.push(`Vorgang · ${input.vorgangTitle?.trim() || input.vorgangId}`);
  parts.push(`Quelle · ${input.source}`);

  return parts.join(" · ");
}

function buildOpenHref(documentId: string): string {
  return `/dokumente?selected=${encodeURIComponent(documentId)}`;
}

function mapCategoryToTypeId(
  skill: HelpySkill,
  category: RecognizedDocumentCategory
): DocumentTypeId {
  if (skill === "real-estate") {
    if (category === "expose") return "expose";
    if (category === "grundriss") return "besichtigungsprotokoll";
    if (category === "vertrag") return "reservationsbestaetigung";
    if (category === "objektbild") return "kaufinteressenten-zusammenfassung";
    return "kaufinteressenten-zusammenfassung";
  }

  if (skill === "construction") {
    if (category === "offerte") return "offerte";
    if (category === "materialliste") return "materialliste";
    if (category === "vertrag") return "auftragsbestaetigung";
    return "arbeitsrapport";
  }

  if (category === "vollmacht") return "vollmacht";
  if (category === "vertrag") return "mandatsbestaetigung";
  return "beratungsprotokoll";
}

function buildPreparedDocumentFromAttachment(input: {
  attachment: GmailAttachmentCandidate;
  category: RecognizedDocumentCategory;
  categoryLabel: string;
  recognizeInput: RecognizeDocumentsInput;
  source: ReturnType<typeof resolveDocumentSource>;
  customerId: string | null;
  dedupeKey: string;
}): PreparedDocument {
  const {
    attachment,
    category,
    categoryLabel,
    recognizeInput,
    source,
    customerId,
    dedupeKey,
  } = input;

  const typeId = mapCategoryToTypeId(recognizeInput.skill, category);
  const customerLabel =
    recognizeInput.customerName?.trim() ||
    recognizeInput.customerEmail?.trim() ||
    "Kunde";

  return {
    id: `recognized-${dedupeKey.replace(/[^a-z0-9]+/gi, "-").slice(0, 96)}`,
    typeId,
    skill: recognizeInput.skill,
    typeLabel: categoryLabel,
    title: attachment.fileName,
    customer: customerLabel,
    vorgangId: recognizeInput.vorgangId,
    vorgangTitle: recognizeInput.vorgangTitle ?? recognizeInput.subject,
    objectId: recognizeInput.objectId ?? undefined,
    status: "zur-pruefung",
    category: "helpy-vorbereitet",
    lastEdited: new Date().toLocaleDateString("de-CH"),
    helpyHint: buildRecommendation(
      recognizeInput.skill,
      category,
      attachment.fileName
    ),
    preparedByHelpy: true,
    attachmentMeta: {
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sourceMessageId: attachment.messageId ?? recognizeInput.messageId,
      providerAttachmentId: attachment.providerAttachmentId,
      sourceThreadId: recognizeInput.sourceThreadId,
      sizeBytes: attachment.sizeBytes,
      sizeLabel: attachment.sizeLabel,
      sourcePlatform: source,
      recognizedCategory: categoryLabel,
      recognizedStatus: "Von HELPY erkannt",
      dedupeKey,
    },
    previewSections: [
      {
        heading: "Erkanntes Dokument",
        content: `${categoryLabel} aus ${source} — bitte Zuordnung prüfen.`,
      },
      {
        heading: "Datei",
        content: attachment.fileName,
      },
      {
        heading: "Quelle",
        content: source,
      },
      {
        heading: "Zuordnung",
        content: buildAssignedToLabel({
          skill: recognizeInput.skill,
          customerName: recognizeInput.customerName,
          customerEmail: recognizeInput.customerEmail,
          objectTitle: recognizeInput.objectTitle,
          vorgangTitle: recognizeInput.vorgangTitle ?? recognizeInput.subject,
          vorgangId: recognizeInput.vorgangId,
          source,
        }),
      },
      {
        heading: "Empfehlung",
        content: buildRecommendation(
          recognizeInput.skill,
          category,
          attachment.fileName
        ),
      },
    ],
    links: {
      objectId: recognizeInput.objectId ?? undefined,
      objectTitle: recognizeInput.objectTitle ?? undefined,
      customerId: customerId ?? undefined,
      customerEmail: recognizeInput.customerEmail,
      customerName: recognizeInput.customerName,
      interessentVorgangIds: [recognizeInput.vorgangId],
      interessentNames: recognizeInput.customerName
        ? [recognizeInput.customerName]
        : undefined,
    },
  };
}

function linkDocumentToObject(objectId: string, documentId: string): void {
  appendDocumentIdToObject(objectId, documentId);
}

function persistRecognizedAttachment(
  attachment: GmailAttachmentCandidate,
  recognizeInput: RecognizeDocumentsInput,
  context: string
): HelpyRecognizedDocument {
  const source = resolveDocumentSource(recognizeInput.sourceQuelle);
  const category = classifyAttachment(recognizeInput.skill, attachment, context);
  const categoryLabel = getCategoryLabel(recognizeInput.skill, category);
  const customerId =
    recognizeInput.customerId ??
    (recognizeInput.customerEmail
      ? buildCustomerIdFromEmail(recognizeInput.customerEmail)
      : null);

  const dedupeKey = buildRecognitionDedupeKey({
    ...attachment,
    messageId: attachment.messageId ?? recognizeInput.messageId,
  });

  const existing = findDocumentByDedupeKey(dedupeKey);
  const preparedDocument = upsertPreparedDocument(
    buildPreparedDocumentFromAttachment({
      attachment,
      category,
      categoryLabel,
      recognizeInput,
      source,
      customerId,
      dedupeKey,
    })
  );

  if (!existing) {
    recordDocumentRecognized(recognizeInput.vorgangId, attachment.fileName);
    processBackgroundMemoryEvent({
      type: "dokument-erkannt",
      vorgangId: recognizeInput.vorgangId,
      email: recognizeInput.customerEmail ?? null,
      text: [attachment.fileName, categoryLabel, context].filter(Boolean).join("\n"),
      objectId: recognizeInput.objectId ?? null,
      category: categoryLabel,
    });
  }

  if (recognizeInput.objectId) {
    linkDocumentToObject(recognizeInput.objectId, preparedDocument.id);
  }

  const assignedToLabel = buildAssignedToLabel({
    skill: recognizeInput.skill,
    customerName: recognizeInput.customerName,
    customerEmail: recognizeInput.customerEmail,
    objectTitle: recognizeInput.objectTitle,
    vorgangTitle: recognizeInput.vorgangTitle ?? recognizeInput.subject,
    vorgangId: recognizeInput.vorgangId,
    source,
  });

  return {
    id: `recognized-view-${preparedDocument.id}`,
    preparedDocumentId: preparedDocument.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    messageId: attachment.messageId ?? recognizeInput.messageId,
    providerAttachmentId: attachment.providerAttachmentId,
    direction: attachment.direction,
    messageReceivedAt: attachment.messageReceivedAt,
    messageSubject: attachment.messageSubject,
    sizeBytes: attachment.sizeBytes,
    sizeLabel: attachment.sizeLabel,
    source,
    category,
    categoryLabel,
    relatedCustomerId: customerId,
    relatedObjectId: recognizeInput.objectId ?? null,
    relatedVorgangId: recognizeInput.vorgangId,
    status: "Von HELPY erkannt",
    assignedToLabel,
    recommendation: buildRecommendation(
      recognizeInput.skill,
      category,
      attachment.fileName
    ),
    openHref: buildOpenHref(preparedDocument.id),
  };
}

export function syncRecognizedDocumentsFromContext(
  input: RecognizeDocumentsInput
): readonly HelpyRecognizedDocument[] {
  const hasRealAttachments = (input.mailAttachments?.length ?? 0) > 0;

  if (
    !hasRealAttachments &&
    !hasGmailAttachmentSignals(input.subject, input.snippet)
  ) {
    return EMPTY_RECOGNIZED_DOCUMENTS;
  }

  const fingerprint = buildInputFingerprint(input);
  const cached = recognizedDocumentsCache.get(input.vorgangId);
  if (cached?.fingerprint === fingerprint) {
    return cached.value;
  }

  const context = `${input.subject} ${input.snippet} ${input.intentLabel ?? ""}`;
  const attachments = resolveAttachmentCandidates(input);

  if (attachments.length === 0) {
    return EMPTY_RECOGNIZED_DOCUMENTS;
  }

  const seenKeys = new Set<string>();
  const documents: HelpyRecognizedDocument[] = [];

  for (const attachment of attachments) {
    const dedupeKey = buildRecognitionDedupeKey(attachment);

    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    documents.push(persistRecognizedAttachment(attachment, input, context));
  }

  const value = Object.freeze(documents);
  recognizedDocumentsCache.set(input.vorgangId, { fingerprint, value });
  return value;
}

export function getRecognizedDocumentsSnapshot(
  vorgangId: string,
  fingerprint: string
): readonly HelpyRecognizedDocument[] {
  const cached = recognizedDocumentsCache.get(vorgangId);
  if (cached?.fingerprint === fingerprint) {
    return cached.value;
  }
  return EMPTY_RECOGNIZED_DOCUMENTS;
}

export function recognizeDocumentsFromGmailContext(
  input: RecognizeDocumentsInput
): readonly HelpyRecognizedDocument[] {
  return syncRecognizedDocumentsFromContext(input);
}

export function invalidateRecognizedDocumentsCache(vorgangId?: string): void {
  if (!vorgangId) {
    recognizedDocumentsCache.clear();
    return;
  }
  recognizedDocumentsCache.delete(vorgangId);
}

export function seedRecognizedDocumentsFromBundles(
  bundles: GmailVorgangBundle[]
): void {
  for (const bundle of bundles) {
    const workspace = bundle.workspace;
    const liste = bundle.liste;
    const customerEmail =
      workspace.kunde.email !== "—" ? workspace.kunde.email : undefined;
    const customerName =
      workspace.kunde.ansprechpartner !== "—"
        ? workspace.kunde.ansprechpartner
        : workspace.kunde.firmenname !== "—"
          ? workspace.kunde.firmenname
          : undefined;
    const object = peekRealEstateObjectByVorgangId(liste.id);

    syncRecognizedDocumentsFromContext({
      vorgangId: liste.id,
      vorgangTitle: liste.titel,
      skill: workspace.skill,
      subject: liste.titel,
      snippet: liste.snippet ?? bundle.message.snippet ?? "",
      intentLabel: liste.intentLabel,
      messageId: bundle.message.id ?? liste.sourceEventId,
      sourceThreadId: liste.threadId ?? bundle.message.threadId,
      sourceQuelle: liste.quelle,
      customerEmail,
      customerName,
      objectId: object?.objectId ?? null,
      objectTitle: object?.titel ?? null,
      mailAttachments: liste.mailAttachments,
    });
  }
}

export function buildRecognizeDocumentsInputFromWorkspace(input: {
  vorgang: {
    id: string;
    skill: HelpySkill;
    kunde: {
      email: string;
      ansprechpartner: string;
      firmenname: string;
    };
    letzteEmail: {
      betreff: string;
      inhalt: string;
      zusammenfassung: string;
    };
    aufgabe: { titel: string };
    kopfzeile?: { intentLabel?: string };
  };
  listeVorgang?: {
    titel?: string;
    snippet?: string;
    intentLabel?: string;
    quelle?: string;
    sourceEventId?: string;
    threadId?: string;
    mailAttachments?: readonly UnifiedMailAttachment[];
  };
  objectId?: string | null;
  objectTitle?: string | null;
}): RecognizeDocumentsInput {
  const { vorgang, listeVorgang } = input;

  return {
    vorgangId: vorgang.id,
    vorgangTitle:
      listeVorgang?.titel ?? vorgang.letzteEmail.betreff ?? vorgang.aufgabe.titel,
    skill: vorgang.skill,
    subject:
      listeVorgang?.titel ?? vorgang.letzteEmail.betreff ?? vorgang.aufgabe.titel,
    snippet:
      listeVorgang?.snippet ??
      vorgang.letzteEmail.inhalt ??
      vorgang.letzteEmail.zusammenfassung,
    intentLabel: listeVorgang?.intentLabel ?? vorgang.kopfzeile?.intentLabel,
    messageId: listeVorgang?.sourceEventId,
    sourceThreadId: listeVorgang?.threadId,
    sourceQuelle: listeVorgang?.quelle ?? "Gmail",
    customerEmail:
      vorgang.kunde.email !== "—" ? vorgang.kunde.email : undefined,
    customerName:
      vorgang.kunde.ansprechpartner !== "—"
        ? vorgang.kunde.ansprechpartner
        : vorgang.kunde.firmenname !== "—"
          ? vorgang.kunde.firmenname
          : undefined,
    objectId: input.objectId ?? null,
    objectTitle: input.objectTitle ?? null,
    mailAttachments: listeVorgang?.mailAttachments,
  };
}
