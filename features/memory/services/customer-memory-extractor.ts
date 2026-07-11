import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  extractSenderName,
} from "@/features/brain/services/brain-result-to-vorgang";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import {
  buildCustomerIdFromEmail,
  getCustomerProfile,
  upsertCustomerProfile,
} from "@/features/memory/services/customer-memory-store";
import type {
  CustomerMemoryContact,
  CustomerMemoryHistoryItem,
  CustomerMemoryHistoryType,
  CustomerMemoryProfile,
} from "@/features/memory/types/customer-memory-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  return from.includes("@") ? from.trim() : "";
}

function inferHistoryType(
  intentLabel?: string,
  skill?: HelpySkill
): CustomerMemoryHistoryType {
  const haystack = (intentLabel ?? "").toLowerCase();

  if (haystack.includes("rechnung")) return "rechnung";
  if (haystack.includes("angebot") || haystack.includes("offert")) return "angebot";
  if (haystack.includes("besichtigung")) return "besichtigung";
  if (haystack.includes("termin")) return "termin";
  if (skill === "construction" && haystack.includes("anfrage")) return "baustelle";

  return "vorgang";
}

function inferCommunicationStyle(intentLabel?: string, snippet?: string): string {
  const haystack = `${intentLabel ?? ""} ${snippet ?? ""}`.toLowerCase();

  if (haystack.includes("rückruf") || haystack.includes("anruf") || haystack.includes("telefon")) {
    return "Bevorzugt Telefon";
  }

  if (haystack.includes("dringend") || haystack.includes("schnell")) {
    return "Kurze, direkte Antworten";
  }

  return "E-Mail und schriftliche Bestätigung";
}

function inferTone(replyTone?: string): string {
  return replyTone ?? "Professionell und freundlich";
}

function upsertHistoryItem(
  history: CustomerMemoryHistoryItem[],
  item: CustomerMemoryHistoryItem
): CustomerMemoryHistoryItem[] {
  const withoutDuplicate = history.filter((entry) => entry.id !== item.id);
  return [item, ...withoutDuplicate].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function buildContactFromSources(input: {
  email: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  skill: HelpySkill;
  intentLabel?: string;
  snippet?: string;
  replyTone?: string;
  existing?: CustomerMemoryContact;
}): CustomerMemoryContact {
  const now = new Date().toISOString();
  const id = buildCustomerIdFromEmail(input.email);

  return {
    id,
    name: input.name || input.existing?.name || "Unbekannt",
    company: input.company || input.existing?.company || input.name,
    email: input.email,
    phone: input.phone !== "—" ? input.phone : input.existing?.phone ?? "—",
    address: input.address !== "—" ? input.address : input.existing?.address ?? "—",
    skill: input.skill,
    communicationStyle:
      inferCommunicationStyle(input.intentLabel, input.snippet) ||
      input.existing?.communicationStyle ||
      "E-Mail und schriftliche Bestätigung",
    tone: inferTone(input.replyTone) || input.existing?.tone || "Professionell und freundlich",
    specialRequests: input.existing?.specialRequests ?? [],
    notes: input.existing?.notes ?? [],
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
    lastContactAt: now,
  };
}

function buildHistoryItems(input: {
  vorgangId: string;
  title: string;
  date: string;
  dateLabel: string;
  summary?: string;
  intentLabel?: string;
  skill: HelpySkill;
  existing: CustomerMemoryHistoryItem[];
}): CustomerMemoryHistoryItem[] {
  let history = [...input.existing];

  const baseType = inferHistoryType(input.intentLabel, input.skill);
  const vorgangItem: CustomerMemoryHistoryItem = {
    id: `history-vorgang-${input.vorgangId}`,
    type: "vorgang",
    title: input.title,
    date: input.date,
    dateLabel: input.dateLabel,
    summary: input.summary,
    vorgangId: input.vorgangId,
    status: "vorbereitet",
  };
  history = upsertHistoryItem(history, vorgangItem);

  if (baseType !== "vorgang") {
    history = upsertHistoryItem(history, {
      id: `history-${baseType}-${input.vorgangId}`,
      type: baseType,
      title: input.title,
      date: input.date,
      dateLabel: input.dateLabel,
      summary: input.summary,
      vorgangId: input.vorgangId,
      status: baseType === "angebot" ? "offen" : "vorbereitet",
    });
  }

  const draft = getReplyDraft(input.vorgangId);
  if (draft) {
    history = upsertHistoryItem(history, {
      id: `history-antwort-${input.vorgangId}`,
      type: "antwort",
      title: `Antwortentwurf: ${draft.subject}`,
      date: input.date,
      dateLabel: input.dateLabel,
      summary: draft.draftText.slice(0, 120),
      vorgangId: input.vorgangId,
      status:
        draft.status === "bestaetigt" || draft.status === "uebernommen"
          ? "bestätigt"
          : "ausstehend",
    });
  }

  return history;
}

export function ingestGmailVorgangBundle(bundle: GmailVorgangBundle): CustomerMemoryProfile | null {
  if (shouldPrepareArchive(bundle.liste)) return null;

  const email =
    extractSenderEmail(bundle.brain.from) ||
    extractSenderEmail(bundle.message.from) ||
    extractSenderEmail(bundle.liste.from ?? "");

  if (!email) return null;

  const customerId = buildCustomerIdFromEmail(email);
  const existing = getCustomerProfile(customerId);
  const draft = getReplyDraft(bundle.liste.id);

  const contact = buildContactFromSources({
    email,
    name: extractSenderName(bundle.brain.from),
    company: extractSenderName(bundle.brain.from),
    phone: bundle.workspace.kunde.telefon,
    address: bundle.workspace.kunde.adresse,
    skill: bundle.workspace.skill,
    intentLabel: bundle.brain.intent,
    snippet: bundle.message.snippet,
    replyTone: draft?.tone,
    existing: existing?.contact,
  });

  const history = buildHistoryItems({
    vorgangId: bundle.liste.id,
    title: bundle.liste.titel,
    date: bundle.liste.receivedAt,
    dateLabel: bundle.liste.receivedLabel,
    summary: bundle.brain.summary,
    intentLabel: bundle.brain.intent,
    skill: bundle.workspace.skill,
    existing: existing?.history ?? [],
  });

  const vorgangIds = [
    bundle.liste.id,
    ...(existing?.vorgangIds.filter((id) => id !== bundle.liste.id) ?? []),
  ];

  const profile: CustomerMemoryProfile = {
    contact,
    history,
    vorgangIds,
  };

  upsertCustomerProfile(profile);
  return profile;
}

export function ingestWorkspaceVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): CustomerMemoryProfile | null {
  if (liste && shouldPrepareArchive(liste)) return null;

  const from = liste?.from ?? vorgang.letzteEmail.absender;
  const email = extractSenderEmail(from) || vorgang.kunde.email;

  if (!email || email === "—") return null;

  const customerId = buildCustomerIdFromEmail(email);
  const existing = getCustomerProfile(customerId);
  const draft = getReplyDraft(vorgang.id);

  const contact = buildContactFromSources({
    email,
    name: vorgang.kunde.ansprechpartner || vorgang.kunde.firmenname,
    company: vorgang.kunde.firmenname,
    phone: vorgang.kunde.telefon,
    address: vorgang.kunde.adresse,
    skill: vorgang.skill,
    intentLabel: liste?.intentLabel ?? vorgang.kopfzeile?.intentLabel,
    snippet: liste?.snippet ?? vorgang.letzteEmail.inhalt,
    replyTone: draft?.tone,
    existing: existing?.contact,
  });

  const history = buildHistoryItems({
    vorgangId: vorgang.id,
    title: vorgang.aufgabe.titel,
    date: liste?.receivedAt ?? new Date().toISOString(),
    dateLabel: liste?.receivedLabel ?? vorgang.letzteEmail.datum,
    summary: vorgang.letzteEmail.zusammenfassung,
    intentLabel: liste?.intentLabel ?? vorgang.aufgabe.kategorie,
    skill: vorgang.skill,
    existing: existing?.history ?? [],
  });

  const profile: CustomerMemoryProfile = {
    contact,
    history,
    vorgangIds: [
      vorgang.id,
      ...(existing?.vorgangIds.filter((id) => id !== vorgang.id) ?? []),
    ],
  };

  upsertCustomerProfile(profile);
  return profile;
}

export function ingestGmailVorgangBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    ingestGmailVorgangBundle(bundle);
  }
}
