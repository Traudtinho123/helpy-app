import { isAppointmentVorgang } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { getAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  readPlatformContextValue,
  resolvePlatformInteressentName,
} from "@/features/brain/services/platform-inquiry-context";
import {
  buildRecognizeDocumentsInputFromWorkspace,
  EMPTY_RECOGNIZED_DOCUMENTS,
  syncRecognizedDocumentsFromContext,
} from "@/features/documents/intelligence/document-recognition-service";
import { getHelpyDecision } from "@/features/decision/services/decision-engine";
import {
  getDocumentsForCustomer,
  getDocumentsForVorgang,
} from "@/features/documents/services/document-engine";
import type { PreparedDocument } from "@/features/documents/services/types";
import { getCrmWorkspaceViewSnapshot } from "@/features/crm/services/crm-workspace-snapshot";
import { peekKundenakteByVorgangId } from "@/features/kundenakte/services/kundenakte-store";
import { subscribeKundenakte } from "@/features/kundenakte/services/kundenakte-store";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { subscribeAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { subscribeHelpyDecision } from "@/features/decision/services/decision-engine";
import { subscribeDocuments } from "@/features/documents/services/document-engine";
import { getReplyDraft, subscribeReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import { subscribeCrm } from "@/features/crm/services/crm-store";
import { subscribeGmailVorgaenge } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import {
  getArchivePreparation,
  shouldPrepareArchiveForWorkspace,
  subscribeArchivePreparation,
} from "@/features/spam-handling/services/archive-handling-engine";
import type {
  WorkspaceAppointmentContext,
  WorkspaceContext,
  WorkspaceCustomerContext,
  WorkspaceMailContext,
  WorkspaceObjectContext,
  WorkspaceRecommendationContext,
  WorkspaceWorkflowContext,
} from "@/features/workspace/context/workspace-context";
import {
  EMPTY_WORKSPACE_APPOINTMENT,
  EMPTY_WORKSPACE_CONTEXT,
  EMPTY_WORKSPACE_CONTEXT_DOCUMENTS,
  EMPTY_WORKSPACE_MAIL_ATTACHMENTS,
  EMPTY_WORKSPACE_RECOGNIZED_DOCUMENTS,
  EMPTY_WORKSPACE_WORKFLOW,
} from "@/features/workspace/context/workspace-context";
import {
  buildGmailWorkflowStepContext,
  resolveGmailWorkflowSteps,
} from "@/features/workspace/services/gmail-workspace/gmail-workflow-steps";
import { dedupeUnifiedMailAttachments } from "@/features/mail/services/mail-attachment-mapper";
import { getMailListeVorgang } from "@/features/mail/unified-mail-source-service";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

const PLACEHOLDER = new Set(["—", "-", "Nicht eindeutig erkannt", ""]);

function isUsable(value?: string | null): value is string {
  return Boolean(value && !PLACEHOLDER.has(value.trim()));
}

type WorkspaceContextCacheEntry = {
  fingerprint: string;
  value: WorkspaceContext;
};

const contextCache = new Map<string, WorkspaceContextCacheEntry>();

function collectDocumentIdKey(
  vorgangId: string,
  customer?: { id?: string | null; email?: string }
): string {
  const ids: string[] = [];

  for (const document of getDocumentsForVorgang(vorgangId)) {
    ids.push(document.id);
  }

  if (customer) {
    for (const document of getDocumentsForCustomer({
      vorgangId,
      email: customer.email,
      customerId: customer.id ?? undefined,
    })) {
      ids.push(document.id);
    }
  }

  if (ids.length === 0) return "";

  const unique = [...new Set(ids)];
  unique.sort();
  return unique.join(",");
}

/** Revisions-Key aus Store-Peeks — kein voller Context-Build nötig. */
function buildWorkspaceContextRevisionKey(
  vorgang: Vorgang,
  liste?: ListeVorgang
): string {
  const kundenakte = peekKundenakteByVorgangId(vorgang.id);
  const crmView = getCrmWorkspaceViewSnapshot(vorgang, liste);
  const customerId =
    kundenakte?.id ?? crmView.customer?.id ?? customerPeekKey(vorgang, liste);
  const object = peekRealEstateObjectByVorgangId(vorgang.id);
  const objectId = object?.objectId ?? platformObjectPeekKey(liste);
  const customerPeek = kundenakte
    ? {
        id: kundenakte.id,
        email: kundenakte.email,
      }
    : crmView.customer
      ? {
          id: crmView.customer.id,
          email: crmView.customer.email,
        }
      : null;
  const documentIds = collectDocumentIdKey(vorgang.id, customerPeek ?? undefined);
  const suggestion = getAppointmentSuggestion(vorgang.id);
  const appointmentId = suggestion?.id ?? "";

  const replyDraft = getReplyDraft(vorgang.id);
  const decision = getHelpyDecision(vorgang.id);
  const archive = getArchivePreparation(vorgang.id);

  return [
    vorgang.id,
    liste?.id ?? "",
    customerId,
    objectId,
    documentIds,
    appointmentId,
    replyDraft?.status ?? "",
    decision?.decisionTitle ?? "",
    archive?.statusLabel ?? "",
    liste?.status ?? "",
    liste?.mailConnectionId ?? "",
    String(liste?.mailAttachments?.length ?? 0),
  ].join("::");
}

function customerPeekKey(vorgang: Vorgang, liste?: ListeVorgang): string {
  const platformName = liste ? resolvePlatformInteressentName(liste) : null;
  const email = vorgang.kunde.email || "";
  const name =
    platformName ??
    (vorgang.kunde.ansprechpartner ||
      vorgang.kunde.firmenname ||
      liste?.kunde ||
      "");
  return name || email ? `peek:${name}:${email}` : "";
}

function platformObjectPeekKey(liste?: ListeVorgang): string {
  const detectedContext = liste?.detectedContext;
  const objekt = readPlatformContextValue(detectedContext, "Objekt");
  const adresse = readPlatformContextValue(detectedContext, "Adresse");
  if (!objekt && !adresse) return "";
  return `platform:${objekt ?? ""}:${adresse ?? ""}`;
}

function dedupeDocuments(documents: PreparedDocument[]): PreparedDocument[] {
  const seen = new Set<string>();
  const result: PreparedDocument[] = [];

  for (const document of documents) {
    if (seen.has(document.id)) continue;
    seen.add(document.id);
    result.push(document);
  }

  return result;
}

function buildCustomer(
  vorgang: Vorgang,
  liste?: ListeVorgang
): WorkspaceCustomerContext | null {
  const kundenakte = peekKundenakteByVorgangId(vorgang.id);
  if (kundenakte) {
    return {
      id: kundenakte.id,
      name: kundenakte.name,
      firma: kundenakte.firma,
      email: kundenakte.email,
      telefon: kundenakte.telefon,
      adresse: kundenakte.adresse,
      quelle: kundenakte.quelle,
      skillLabel: kundenakte.skillLabel,
      status: kundenakte.status,
      statusLabel: kundenakte.statusLabel,
      helpyHint: kundenakte.helpyHint,
      betreff: kundenakte.betreff,
      isKnownCustomer: kundenakte.isKnownCustomer,
      source: "kundenakte",
    };
  }

  const crmView = getCrmWorkspaceViewSnapshot(vorgang, liste);
  const crmCustomer = crmView.customer;
  if (crmCustomer) {
    return {
      id: crmCustomer.id,
      name: crmCustomer.ansprechpartner || crmCustomer.firma,
      firma: crmCustomer.firma,
      email: crmCustomer.email,
      telefon: crmCustomer.telefon,
      adresse: crmCustomer.adresse,
      quelle: liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail",
      skillLabel: liste?.skillLabel ?? "",
      status: crmCustomer.status,
      statusLabel:
        crmCustomer.status === "neu" ? "Neuer Kunde" : "Bestandskunde",
      helpyHint: "",
      betreff: liste?.titel ?? vorgang.letzteEmail.betreff,
      isKnownCustomer: !crmView.isNewCustomer,
      source: "crm",
    };
  }

  const platformName = liste ? resolvePlatformInteressentName(liste) : null;
  const name =
    platformName ??
    (isUsable(vorgang.kunde.ansprechpartner)
      ? vorgang.kunde.ansprechpartner
      : isUsable(vorgang.kunde.firmenname)
        ? vorgang.kunde.firmenname
        : isUsable(liste?.kunde)
          ? liste.kunde
          : null);

  if (!name && !isUsable(vorgang.kunde.email)) {
    return null;
  }

  return {
    id: null,
    name: name ?? "Interessent",
    firma: vorgang.kunde.firmenname,
    email: vorgang.kunde.email,
    telefon: vorgang.kunde.telefon,
    adresse: vorgang.kunde.adresse,
    quelle: liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail",
    skillLabel: liste?.skillLabel ?? "",
    status: vorgang.kunde.status,
    statusLabel: vorgang.kunde.status,
    helpyHint: vorgang.helpy.empfehlung,
    betreff: liste?.titel ?? vorgang.letzteEmail.betreff,
    isKnownCustomer: false,
    source: "vorgang",
  };
}

function buildObject(vorgangId: string, liste?: ListeVorgang): WorkspaceObjectContext | null {
  const object = peekRealEstateObjectByVorgangId(vorgangId);
  if (object) {
    return {
      objectId: object.objectId,
      titel: object.titel,
      adresse: `${object.adresse}, ${object.plz} ${object.ort}`,
      quelle: object.quelle,
      preis: object.preis,
      status: object.status,
      source: "object-memory",
      platform: null,
    };
  }

  const detectedContext = liste?.detectedContext;
  const platform = {
    objekt: readPlatformContextValue(detectedContext, "Objekt"),
    adresse: readPlatformContextValue(detectedContext, "Adresse"),
    link: readPlatformContextValue(detectedContext, "Link"),
    besichtigung: readPlatformContextValue(detectedContext, "Besichtigung"),
    nachricht: readPlatformContextValue(detectedContext, "Nachricht"),
  };

  if (!platform.objekt && !platform.adresse && !platform.link) {
    return null;
  }

  return {
    objectId: null,
    titel: platform.objekt ?? "Objekt",
    adresse: platform.adresse ?? "",
    quelle: liste?.quelle ?? "Plattform",
    preis: null,
    status: "Im Workspace erkannt",
    source: "platform",
    platform,
  };
}

function buildMail(vorgang: Vorgang, liste?: ListeVorgang): WorkspaceMailContext {
  return {
    betreff: liste?.titel ?? vorgang.letzteEmail.betreff,
    absender: liste?.from ?? vorgang.letzteEmail.absender,
    datum: liste?.receivedLabel ?? vorgang.letzteEmail.datum,
    inhalt: vorgang.letzteEmail.inhalt,
    zusammenfassung: liste?.summary ?? vorgang.letzteEmail.zusammenfassung,
    snippet: liste?.snippet ?? "",
    quelle: liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail",
    intentLabel: liste?.intentLabel ?? vorgang.kopfzeile?.intentLabel ?? null,
    summary: liste?.summary ?? null,
    detectedContext: Object.freeze([...(liste?.detectedContext ?? [])]),
    replyDraft: getReplyDraft(vorgang.id),
  };
}

function buildAppointment(
  vorgang: Vorgang,
  liste?: ListeVorgang
): WorkspaceAppointmentContext {
  const suggestion = getAppointmentSuggestion(vorgang.id);
  const terminwunsch = readPlatformContextValue(liste?.detectedContext, "Besichtigung");
  const fallbackTermin = vorgang.termine[0]
    ? {
        titel: vorgang.termine[0].titel,
        datum: vorgang.termine[0].datum,
        ort: vorgang.termine[0].ort,
      }
    : null;

  const showViewingConfirmed =
    suggestion?.confirmationStatus === "customer_confirmed" ||
    suggestion?.confirmationStatus === "saved_to_calendar";

  const showTerminstatus =
    suggestion?.confirmationStatus === "slots_offered" ||
    Boolean(suggestion?.slotsOfferedAt && suggestion.confirmationStatus !== "saved_to_calendar");

  const isArchive = shouldPrepareArchiveForWorkspace(vorgang, liste);
  const showSuggestions =
    !isArchive &&
    isAppointmentVorgang(vorgang, liste) &&
    !showViewingConfirmed &&
    !showTerminstatus;

  if (!suggestion && !terminwunsch && !fallbackTermin && !showSuggestions) {
    return EMPTY_WORKSPACE_APPOINTMENT;
  }

  return {
    suggestion,
    terminwunsch,
    fallbackTermin,
    showSuggestions,
    showViewingConfirmed,
    showTerminstatus,
  };
}

function buildDocuments(
  vorgang: Vorgang,
  customer: WorkspaceCustomerContext | null
): readonly PreparedDocument[] {
  const byVorgang = getDocumentsForVorgang(vorgang.id);
  const byCustomer = getDocumentsForCustomer({
    vorgangId: vorgang.id,
    email: customer?.email,
    customerId: customer?.id ?? undefined,
  });

  const merged = dedupeDocuments([...byVorgang, ...byCustomer]);
  return merged.length === 0 ? EMPTY_WORKSPACE_CONTEXT_DOCUMENTS : Object.freeze(merged);
}

function buildRecognizedDocuments(
  vorgang: Vorgang,
  liste: ListeVorgang | null,
  object: WorkspaceObjectContext | null
): readonly import("@/features/documents/intelligence/document-types").HelpyRecognizedDocument[] {
  const input = buildRecognizeDocumentsInputFromWorkspace({
    vorgang,
    listeVorgang: liste ?? undefined,
    objectId: object?.objectId ?? null,
    objectTitle: object?.titel ?? null,
  });
  const documents = syncRecognizedDocumentsFromContext(input);
  return documents === EMPTY_RECOGNIZED_DOCUMENTS
    ? EMPTY_WORKSPACE_RECOGNIZED_DOCUMENTS
    : documents;
}

function buildRecommendation(vorgangId: string): WorkspaceRecommendationContext | null {
  const decision = getHelpyDecision(vorgangId);
  if (!decision) return null;

  return {
    decisionTitle: decision.decisionTitle,
    nextBestStep: decision.nextBestStep,
    reason: decision.reason,
    preparedItems: Object.freeze([...decision.preparedItems]),
    helpyMessage: decision.helpyMessage,
  };
}

function buildWorkflow(
  vorgang: Vorgang,
  liste: ListeVorgang | null,
  recommendation: WorkspaceRecommendationContext | null
): WorkspaceWorkflowContext {
  const isArchive = shouldPrepareArchiveForWorkspace(vorgang, liste ?? undefined);
  const archivePreparation = isArchive ? getArchivePreparation(vorgang.id) : null;
  const steps = Object.freeze(
    resolveGmailWorkflowSteps(
      buildGmailWorkflowStepContext(vorgang, liste ?? undefined)
    )
  );

  const nextBestStep = isArchive
    ? archivePreparation?.statusLabel ?? vorgang.helpy.naechsterSchritt
    : recommendation?.nextBestStep ?? vorgang.helpy.naechsterSchritt;

  const preparedItems = isArchive && archivePreparation
    ? Object.freeze([
        archivePreparation.recommendation,
        archivePreparation.statusLabel,
      ])
    : recommendation?.preparedItems ?? EMPTY_WORKSPACE_WORKFLOW.preparedItems;

  return {
    steps,
    isArchive,
    archiveStatusLabel: archivePreparation?.statusLabel ?? null,
    archiveRecommendation: archivePreparation?.recommendation ?? null,
    nextBestStep,
    preparedItems,
  };
}

export function buildWorkspaceContext(
  vorgang: Vorgang,
  listeVorgang?: ListeVorgang
): WorkspaceContext {
  const liste = listeVorgang ?? getMailListeVorgang(vorgang.id) ?? null;
  const customer = buildCustomer(vorgang, liste ?? undefined);
  const object = buildObject(vorgang.id, liste ?? undefined);
  const mail = buildMail(vorgang, liste ?? undefined);
  const appointment = buildAppointment(vorgang, liste ?? undefined);
  const documents = buildDocuments(vorgang, customer);
  const recognizedDocuments = buildRecognizedDocuments(vorgang, liste, object);
  const recommendation = buildRecommendation(vorgang.id);
  const currentWorkflow = buildWorkflow(vorgang, liste, recommendation);

  return {
    workspaceId: vorgang.id,
    vorgang,
    listeVorgang: liste,
    customer,
    object,
    mail,
    appointment,
    documents,
    recognizedDocuments,
    mailAttachments: dedupeUnifiedMailAttachments(
      liste?.mailAttachments ?? EMPTY_WORKSPACE_MAIL_ATTACHMENTS
    ),
    recommendation,
    currentWorkflow,
  };
}

export function getStableWorkspaceContext(
  vorgang: Vorgang,
  listeVorgang?: ListeVorgang
): WorkspaceContext {
  const liste = listeVorgang ?? getMailListeVorgang(vorgang.id) ?? undefined;
  const revisionKey = buildWorkspaceContextRevisionKey(vorgang, liste);
  const cached = contextCache.get(vorgang.id);

  if (cached?.fingerprint === revisionKey) {
    return cached.value;
  }

  const next = buildWorkspaceContext(vorgang, liste);
  contextCache.set(vorgang.id, { fingerprint: revisionKey, value: next });
  return next;
}

export function peekWorkspaceContext(workspaceId: string): WorkspaceContext | null {
  return contextCache.get(workspaceId)?.value ?? null;
}

export function getServerWorkspaceContextSnapshot(): WorkspaceContext {
  return EMPTY_WORKSPACE_CONTEXT;
}

export function subscribeWorkspaceContext(listener: () => void): () => void {
  const unsubscribers = [
    subscribeKundenakte(listener),
    subscribeDocuments(listener),
    subscribeAppointmentSuggestion(listener),
    subscribeReplyDraft(listener),
    subscribeHelpyDecision(listener),
    subscribeRealEstateObjects(listener),
    subscribeCrm(listener),
    subscribeGmailVorgaenge(listener),
    subscribeArchivePreparation(listener),
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export function findWorkspaceDocument(
  context: WorkspaceContext,
  input: {
    documentId?: string;
    focus?: "expose" | "offerte" | "dokument";
  }
): PreparedDocument | undefined {
  const { documentId, focus } = input;

  if (documentId) {
    return context.documents.find((document) => document.id === documentId);
  }

  if (focus === "expose") {
    return context.documents.find((document) => document.typeId === "expose");
  }

  if (focus === "offerte") {
    return context.documents.find(
      (document) => document.typeId === "offerte" || document.typeId === "angebot"
    );
  }

  return context.documents[0];
}

export function customerToVorgangKunde(
  customer: WorkspaceCustomerContext
): Vorgang["kunde"] {
  return {
    firmenname: customer.firma,
    ansprechpartner: customer.name,
    email: customer.email,
    telefon: customer.telefon,
    adresse: customer.adresse,
    status: customer.statusLabel || customer.status,
  };
}
