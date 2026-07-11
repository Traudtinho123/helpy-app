import { getAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  readPlatformContextValue,
  resolvePlatformInteressentName,
} from "@/features/brain/services/platform-inquiry-context";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { getHelpyDecision } from "@/features/decision/services/decision-engine";
import { peekKundenakteByVorgangId } from "@/features/kundenakte/services/kundenakte-store";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import {
  getArchivePreparation,
  shouldPrepareArchiveForWorkspace,
} from "@/features/spam-handling/services/archive-handling-engine";
import {
  buildGmailWorkflowStepContext,
  resolveGmailWorkflowSteps,
} from "@/features/workspace/services/gmail-workspace/gmail-workflow-steps";
import type { WorkspaceContext } from "@/features/workspace/context/workspace-context";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export type WorkspaceSummaryInput = {
  vorgang: WorkspaceVorgang;
  liste?: ListeVorgang;
  customerName?: string;
};

const PLACEHOLDER = new Set(["—", "-", "Nicht eindeutig erkannt", ""]);

function isUsable(value?: string | null): value is string {
  return Boolean(value && !PLACEHOLDER.has(value.trim()));
}

function truncateSentence(value: string, maxLength = 120): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  const shortened = trimmed.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${(lastSpace > 40 ? shortened.slice(0, lastSpace) : shortened).trim()}…`;
}

function extractCityFromAddress(adresse: string): string | null {
  const parts = adresse
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1] ?? null;

  const plzMatch = adresse.match(/\b\d{4}\s+(.+)$/);
  return plzMatch?.[1]?.trim() ?? null;
}

function resolveCustomerName(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang,
  customerName?: string
): string {
  if (isUsable(customerName)) return customerName.trim();

  const platformName = liste ? resolvePlatformInteressentName(liste) : null;
  if (isUsable(platformName)) return platformName;

  const kunde = vorgang.kunde.ansprechpartner ?? vorgang.kunde.firmenname;
  if (isUsable(kunde)) return kunde;

  if (isUsable(liste?.kunde)) return liste.kunde.trim();

  return "Interessent";
}

function resolveAnliegen(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang,
  isPlatformInquiry?: boolean
): string | null {
  const context = liste?.detectedContext;
  const objekt = readPlatformContextValue(context, "Objekt");
  const adresse = readPlatformContextValue(context, "Adresse");
  const city = adresse ? extractCityFromAddress(adresse) : null;

  if (isUsable(objekt) && city) return `${objekt} in ${city}`;
  if (isUsable(objekt)) return objekt;
  if (city) return `einer Immobilie in ${city}`;
  if (isUsable(adresse)) return adresse;

  const object = peekRealEstateObjectByVorgangId(vorgang.id);
  if (object) {
    const objectCity = extractCityFromAddress(`${object.adresse}, ${object.plz} ${object.ort}`);
    if (objectCity) return `${object.titel} in ${objectCity}`;
    return object.titel;
  }

  const intentLabel = liste?.intentLabel ?? vorgang.kopfzeile?.intentLabel;
  if (isUsable(intentLabel) && !intentLabel.includes(":")) {
    return intentLabel.toLowerCase();
  }

  if (isUsable(liste?.summary)) {
    return truncateSentence(liste.summary, 90);
  }

  if (isUsable(vorgang.letzteEmail.zusammenfassung)) {
    return truncateSentence(vorgang.letzteEmail.zusammenfassung, 90);
  }

  if (isPlatformInquiry && isUsable(liste?.snippet)) {
    return truncateSentence(liste.snippet, 90);
  }

  const betreff = vorgang.letzteEmail.betreff ?? liste?.titel;
  if (isUsable(betreff)) return truncateSentence(betreff, 90);

  return null;
}

function hasViewingRequest(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): boolean {
  if (readPlatformContextValue(liste?.detectedContext, "Besichtigung")) {
    return true;
  }

  const haystack = [
    liste?.intent,
    liste?.intentLabel,
    liste?.typ,
    liste?.summary,
    liste?.snippet,
    vorgang.kopfzeile?.intentLabel,
    vorgang.aufgabe.kategorie,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /besichtigung|terminwunsch|termin/.test(haystack);
}

function buildOpenerLine(input: WorkspaceSummaryInput, isPlatformInquiry: boolean): string | null {
  const { vorgang, liste, customerName } = input;
  const name = resolveCustomerName(vorgang, liste, customerName);
  const anliegen = resolveAnliegen(vorgang, liste, isPlatformInquiry);
  const usesGenericName = name === "Interessent" || isPlatformInquiry;

  if (anliegen) {
    if (usesGenericName) {
      return `${name} fragt wegen ${anliegen} an.`;
    }
    return `${name} schreibt wegen ${anliegen}.`;
  }

  if (usesGenericName) {
    return `${name} hat eine neue Anfrage geschickt.`;
  }

  return `${name} hat sich gemeldet.`;
}

function buildRecognizedLine(
  vorgang: WorkspaceVorgang,
  liste: ListeVorgang | undefined,
  opener: string | null
): string | null {
  const lines: string[] = [];
  const openerLower = opener?.toLowerCase() ?? "";

  if (hasViewingRequest(vorgang, liste) && !openerLower.includes("besichtigung")) {
    lines.push("Besichtigung gewünscht.");
  }

  const appointment = getAppointmentSuggestion(vorgang.id);
  if (
    appointment?.viewingConfirmation &&
    appointment.confirmationStatus === "customer_confirmed" &&
    lines.length === 0
  ) {
    lines.push("Besichtigung wurde bestätigt.");
  }

  if (peekRealEstateObjectByVorgangId(vorgang.id) && !openerLower.includes("objekt")) {
    lines.push("Objekt wurde erkannt.");
  }

  return lines[0] ?? null;
}

function buildPreparedLines(vorgangId: string, isArchive: boolean): string[] {
  if (isArchive) {
    const archive = getArchivePreparation(vorgangId);
    if (archive) return ["Archivierung ist vorbereitet."];
    return ["Archivierung wurde vorbereitet."];
  }

  const prepared: string[] = [];
  const draft = getReplyDraft(vorgangId);
  if (draft && draft.status !== "uebernommen") {
    prepared.push("Antwort ist vorbereitet.");
  }

  const appointment = getAppointmentSuggestion(vorgangId);
  if (appointment?.slots?.length) {
    prepared.push("Kalendertermine wurden gefunden.");
  } else if (appointment?.viewingConfirmation) {
    prepared.push("Besichtigungstermin ist vorbereitet.");
  }

  if (peekKundenakteByVorgangId(vorgangId)) {
    prepared.push("Kundenakte ist vorbereitet.");
  }

  const decision = getHelpyDecision(vorgangId);
  if (prepared.length === 0 && decision?.preparedItems.length) {
    const friendly = decision.preparedItems
      .map((item) => item.replace(/\svorbereiten$/i, ""))
      .filter(Boolean)
      .slice(0, 2);

    if (friendly.length === 1) {
      prepared.push(`${friendly[0]} ist vorbereitet.`);
    } else if (friendly.length > 1) {
      prepared.push(`${friendly[0]} und ${friendly[1]} sind vorbereitet.`);
    }
  }

  return prepared.slice(0, 2);
}

const MISSING_STEP_LABELS: Partial<Record<string, string>> = {
  kundenakte: "Kontaktangaben",
  objekt: "Objektangaben",
  termin: "Terminwunsch",
  antwort: "Antwortgrundlage",
  expose: "Exposé",
  offerte: "Offertendetails",
  materialliste: "Materialliste",
  frist: "Fristenangaben",
  dokument: "Dokumentangaben",
  erstgespraech: "Erstgespräch",
  checkliste: "Checkliste",
};

function buildMissingLine(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): string | null {
  const ctx = buildGmailWorkflowStepContext(vorgang, liste);
  const missingSteps = resolveGmailWorkflowSteps(ctx)
    .filter((step) => step.incomplete)
    .map((step) => MISSING_STEP_LABELS[step.actionKind] ?? step.title)
    .filter(Boolean);

  const draftMissing = getReplyDraft(vorgang.id)?.missingInfo ?? [];
  const combined = [...new Set([...missingSteps, ...draftMissing])].slice(0, 3);

  if (combined.length === 0) return null;
  if (combined.length === 1) {
    return `Es fehlt noch: ${combined[0]}.`;
  }

  const last = combined.at(-1);
  const rest = combined.slice(0, -1).join(", ");
  return `Es fehlen noch: ${rest} und ${last}.`;
}

function buildLegacySummary(vorgang: WorkspaceVorgang): string[] {
  const lines: string[] = [];

  const name = resolveCustomerName(vorgang);
  const anliegen =
    resolveAnliegen(vorgang) ??
    (isUsable(vorgang.helpy.erkannt)
      ? truncateSentence(vorgang.helpy.erkannt, 90)
      : null);

  if (anliegen) {
    lines.push(`${name} schreibt wegen ${anliegen}.`);
  } else if (isUsable(vorgang.helpy.erkannt)) {
    lines.push(truncateSentence(vorgang.helpy.erkannt));
  }

  if (isUsable(vorgang.helpy.empfehlung)) {
    lines.push(truncateSentence(vorgang.helpy.empfehlung, 100));
  } else if (isUsable(vorgang.helpy.naechsterSchritt)) {
    lines.push(truncateSentence(vorgang.helpy.naechsterSchritt, 100));
  }

  return lines.slice(0, 4);
}

export function buildWorkspaceSummary(input: WorkspaceSummaryInput): string[] {
  const { vorgang, liste } = input;
  const quelle = liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail";
  const isPlatformInquiry = isPlatformRealEstateQuelle(quelle);
  const isArchive = shouldPrepareArchiveForWorkspace(vorgang, liste);

  if (!liste && !isArchive) {
    return buildLegacySummary(vorgang);
  }

  const lines: string[] = [];
  const opener = buildOpenerLine(input, isPlatformInquiry);
  if (opener) lines.push(opener);

  if (!isArchive) {
    const recognized = buildRecognizedLine(vorgang, liste, opener);
    if (recognized) lines.push(recognized);
  }

  for (const preparedLine of buildPreparedLines(vorgang.id, isArchive)) {
    if (lines.length >= 4) break;
    lines.push(preparedLine);
  }

  if (!isArchive && lines.length < 4) {
    const missing = buildMissingLine(vorgang, liste);
    if (missing) lines.push(missing);
  }

  return lines.slice(0, 4);
}

function buildRecognizedLineFromContext(
  context: WorkspaceContext,
  opener: string | null
): string | null {
  const { vorgang, listeVorgang, object, appointment } = context;
  const lines: string[] = [];
  const openerLower = opener?.toLowerCase() ?? "";

  if (hasViewingRequest(vorgang, listeVorgang ?? undefined) && !openerLower.includes("besichtigung")) {
    lines.push("Besichtigung gewünscht.");
  }

  const suggestion = appointment.suggestion;
  if (
    suggestion?.viewingConfirmation &&
    suggestion.confirmationStatus === "customer_confirmed" &&
    lines.length === 0
  ) {
    lines.push("Besichtigung wurde bestätigt.");
  }

  if (object && !openerLower.includes("objekt")) {
    lines.push("Objekt wurde erkannt.");
  }

  return lines[0] ?? null;
}

function buildPreparedLinesFromContext(context: WorkspaceContext): string[] {
  const { mail, appointment, customer, recommendation, currentWorkflow } = context;

  if (currentWorkflow.isArchive) {
    if (currentWorkflow.archiveStatusLabel) {
      return ["Archivierung ist vorbereitet."];
    }
    return ["Archivierung wurde vorbereitet."];
  }

  const prepared: string[] = [];
  const draft = mail.replyDraft;
  if (draft && draft.status !== "uebernommen") {
    prepared.push("Antwort ist vorbereitet.");
  }

  const suggestion = appointment.suggestion;
  if (suggestion?.slots?.length) {
    prepared.push("Kalendertermine wurden gefunden.");
  } else if (suggestion?.viewingConfirmation) {
    prepared.push("Besichtigungstermin ist vorbereitet.");
  }

  if (customer?.source === "kundenakte") {
    prepared.push("Kundenakte ist vorbereitet.");
  }

  if (prepared.length === 0 && recommendation?.preparedItems.length) {
    const friendly = recommendation.preparedItems
      .map((item) => item.replace(/\svorbereiten$/i, ""))
      .filter(Boolean)
      .slice(0, 2);

    if (friendly.length === 1) {
      prepared.push(`${friendly[0]} ist vorbereitet.`);
    } else if (friendly.length > 1) {
      prepared.push(`${friendly[0]} und ${friendly[1]} sind vorbereitet.`);
    }
  }

  return prepared.slice(0, 2);
}

function buildMissingLineFromContext(context: WorkspaceContext): string | null {
  const missingSteps = context.currentWorkflow.steps
    .filter((step) => step.incomplete)
    .map((step) => MISSING_STEP_LABELS[step.actionKind] ?? step.title)
    .filter(Boolean);

  const draftMissing = context.mail.replyDraft?.missingInfo ?? [];
  const combined = [...new Set([...missingSteps, ...draftMissing])].slice(0, 3);

  if (combined.length === 0) return null;
  if (combined.length === 1) {
    return `Es fehlt noch: ${combined[0]}.`;
  }

  const last = combined.at(-1);
  const rest = combined.slice(0, -1).join(", ");
  return `Es fehlen noch: ${rest} und ${last}.`;
}

function resolveAnliegenFromContext(
  context: WorkspaceContext,
  isPlatformInquiry?: boolean
): string | null {
  const { vorgang, listeVorgang, object, mail } = context;
  const detectedContext = [...(listeVorgang?.detectedContext ?? mail.detectedContext)];
  const objekt = readPlatformContextValue(detectedContext, "Objekt");
  const adresse = readPlatformContextValue(detectedContext, "Adresse");
  const city = adresse ? extractCityFromAddress(adresse) : null;

  if (isUsable(objekt) && city) return `${objekt} in ${city}`;
  if (isUsable(objekt)) return objekt;
  if (city) return `einer Immobilie in ${city}`;
  if (isUsable(adresse)) return adresse;

  if (object) {
    const objectCity = extractCityFromAddress(object.adresse);
    if (objectCity) return `${object.titel} in ${objectCity}`;
    return object.titel;
  }

  const intentLabel = listeVorgang?.intentLabel ?? vorgang.kopfzeile?.intentLabel;
  if (isUsable(intentLabel) && !intentLabel.includes(":")) {
    return intentLabel.toLowerCase();
  }

  if (isUsable(listeVorgang?.summary)) {
    return truncateSentence(listeVorgang.summary, 90);
  }

  if (isUsable(mail.zusammenfassung)) {
    return truncateSentence(mail.zusammenfassung, 90);
  }

  if (isPlatformInquiry && isUsable(mail.snippet)) {
    return truncateSentence(mail.snippet, 90);
  }

  const betreff = mail.betreff ?? listeVorgang?.titel;
  if (isUsable(betreff)) return truncateSentence(betreff, 90);

  return null;
}

function buildOpenerLineFromContext(
  context: WorkspaceContext,
  isPlatformInquiry: boolean
): string | null {
  const { vorgang, listeVorgang, customer } = context;
  const name = resolveCustomerName(
    vorgang,
    listeVorgang ?? undefined,
    customer?.name
  );
  const anliegen = resolveAnliegenFromContext(context, isPlatformInquiry);
  const usesGenericName = name === "Interessent" || isPlatformInquiry;

  if (anliegen) {
    if (usesGenericName) {
      return `${name} fragt wegen ${anliegen} an.`;
    }
    return `${name} schreibt wegen ${anliegen}.`;
  }

  if (usesGenericName) {
    return `${name} hat eine neue Anfrage geschickt.`;
  }

  return `${name} hat sich gemeldet.`;
}

/** Baut die HELPY-Übersicht ausschließlich aus dem Workspace Context. */
export function buildWorkspaceSummaryFromContext(
  context: WorkspaceContext
): string[] {
  const { vorgang, listeVorgang, mail, currentWorkflow } = context;
  const quelle = mail.quelle;
  const isPlatformInquiry = isPlatformRealEstateQuelle(quelle);
  const isArchive = currentWorkflow.isArchive;

  if (!listeVorgang && !isArchive) {
    return buildLegacySummary(vorgang);
  }

  const lines: string[] = [];
  const opener = buildOpenerLineFromContext(context, isPlatformInquiry);
  if (opener) lines.push(opener);

  if (!isArchive) {
    const recognized = buildRecognizedLineFromContext(context, opener);
    if (recognized) lines.push(recognized);
  }

  for (const preparedLine of buildPreparedLinesFromContext(context)) {
    if (lines.length >= 4) break;
    lines.push(preparedLine);
  }

  if (!isArchive && lines.length < 4) {
    const missing = buildMissingLineFromContext(context);
    if (missing) lines.push(missing);
  }

  return lines.slice(0, 4);
}

export const EMPTY_WORKSPACE_SUMMARY: readonly string[] = [];

type WorkspaceSummaryCacheEntry = {
  fingerprint: string;
  value: readonly string[];
};

const summaryCache = new Map<string, WorkspaceSummaryCacheEntry>();

function summaryLinesEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length && left.every((line, index) => line === right[index]);
}

function buildSummaryFingerprint(input: WorkspaceSummaryInput): string {
  const { vorgang, liste, customerName } = input;
  const draft = getReplyDraft(vorgang.id);
  const appointment = getAppointmentSuggestion(vorgang.id);
  const decision = getHelpyDecision(vorgang.id);
  const kundenakte = peekKundenakteByVorgangId(vorgang.id);
  const object = peekRealEstateObjectByVorgangId(vorgang.id);
  const archive = getArchivePreparation(vorgang.id);
  const incompleteSteps = resolveGmailWorkflowSteps(
    buildGmailWorkflowStepContext(vorgang, liste)
  )
    .filter((step) => step.incomplete)
    .map((step) => step.actionKind)
    .join("|");

  return [
    vorgang.id,
    customerName ?? "",
    liste?.id ?? "",
    liste?.summary ?? "",
    liste?.intentLabel ?? "",
    (liste?.detectedContext ?? []).join("|"),
    draft?.status ?? "",
    (draft?.missingInfo ?? []).join("|"),
    appointment?.status ?? "",
    String(appointment?.slots?.length ?? 0),
    appointment?.confirmationStatus ?? "",
    decision?.decisionTitle ?? "",
    kundenakte?.status ?? "",
    object?.objectId ?? "",
    archive?.status ?? "",
    incompleteSteps,
    vorgang.helpy.erkannt ?? "",
    vorgang.helpy.empfehlung ?? "",
    vorgang.helpy.naechsterSchritt ?? "",
  ].join("::");
}

/** Liefert eine zwischen Render-Zyklen stabile Snapshot-Referenz für useSyncExternalStore. */
export function getStableWorkspaceSummary(
  input: WorkspaceSummaryInput
): readonly string[] {
  const fingerprint = buildSummaryFingerprint(input);
  const cached = summaryCache.get(input.vorgang.id);

  if (cached?.fingerprint === fingerprint) {
    return cached.value;
  }

  const next = buildWorkspaceSummary(input);
  const value = next.length === 0 ? EMPTY_WORKSPACE_SUMMARY : next;

  if (cached && summaryLinesEqual(cached.value, value)) {
    summaryCache.set(input.vorgang.id, { fingerprint, value: cached.value });
    return cached.value;
  }

  summaryCache.set(input.vorgang.id, { fingerprint, value });
  return value;
}

