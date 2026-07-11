import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { extractSenderName } from "@/features/brain/services/brain-result-to-vorgang";
import { applyPipelineTrigger } from "@/features/crm/pipeline/pipeline-engine";
import { buildCrmCustomerId } from "@/features/crm/services/crm-merge";
import {
  findCrmCustomerByMatch,
  getAllCrmCustomers,
  upsertCrmCustomer,
} from "@/features/crm/services/crm-store";
import type {
  CrmDocument,
  CrmProject,
  CrmTimelineEntry,
  CrmTimelineType,
  HelpyCrmCustomer,
} from "@/features/crm/types/crm-types";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  return from.includes("@") ? from.trim() : "";
}

function skillToBranche(skill: HelpySkill): string {
  return getSkillConfig(skill).label.replace(/^HELPY\s+/i, "");
}

function inferTimelineType(
  intentLabel?: string,
  skill?: HelpySkill
): CrmTimelineType {
  const haystack = (intentLabel ?? "").toLowerCase();

  if (haystack.includes("rechnung")) return "rechnung";
  if (haystack.includes("dokument")) return "dokument";
  if (haystack.includes("angebot") || haystack.includes("offert")) return "angebot";
  if (haystack.includes("besichtigung")) return "besichtigung";
  if (haystack.includes("termin")) return "termin";
  if (skill === "construction" && haystack.includes("anfrage")) return "baustelle";

  return "vorgang";
}

function upsertTimelineItem(
  timeline: CrmTimelineEntry[],
  item: CrmTimelineEntry
): CrmTimelineEntry[] {
  const withoutDuplicate = timeline.filter((entry) => entry.id !== item.id);
  return [item, ...withoutDuplicate].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function buildTimelineFromVorgang(input: {
  vorgangId: string;
  title: string;
  date: string;
  dateLabel: string;
  summary?: string;
  intentLabel?: string;
  skill: HelpySkill;
  existing: CrmTimelineEntry[];
}): {
  timeline: CrmTimelineEntry[];
  offers: CrmTimelineEntry[];
  invoices: CrmTimelineEntry[];
  appointments: CrmTimelineEntry[];
  documents: CrmDocument[];
  projects: CrmProject[];
} {
  let timeline = [...input.existing];
  const offers: CrmTimelineEntry[] = [];
  const invoices: CrmTimelineEntry[] = [];
  const appointments: CrmTimelineEntry[] = [];
  const documents: CrmDocument[] = [];
  const projects: CrmProject[] = [];

  const baseType = inferTimelineType(input.intentLabel, input.skill);

  const vorgangItem: CrmTimelineEntry = {
    id: `crm-vorgang-${input.vorgangId}`,
    type: "vorgang",
    title: input.title,
    date: input.date,
    dateLabel: input.dateLabel,
    summary: input.summary,
    vorgangId: input.vorgangId,
    status: "vorbereitet",
  };
  timeline = upsertTimelineItem(timeline, vorgangItem);

  if (baseType !== "vorgang") {
    const typedItem: CrmTimelineEntry = {
      id: `crm-${baseType}-${input.vorgangId}`,
      type: baseType,
      title: input.title,
      date: input.date,
      dateLabel: input.dateLabel,
      summary: input.summary,
      vorgangId: input.vorgangId,
      status: baseType === "angebot" ? "offen" : "vorbereitet",
    };
    timeline = upsertTimelineItem(timeline, typedItem);

    if (baseType === "angebot") offers.push(typedItem);
    if (baseType === "rechnung") invoices.push(typedItem);
    if (
      baseType === "termin" ||
      baseType === "besichtigung" ||
      baseType === "baustelle"
    ) {
      appointments.push(typedItem);
    }
    if (baseType === "dokument") {
      documents.push({
        id: `crm-doc-${input.vorgangId}`,
        title: input.title,
        type: "Dokument",
        date: input.dateLabel,
        vorgangId: input.vorgangId,
      });
    }
    if (baseType === "baustelle" || baseType === "besichtigung") {
      projects.push({
        id: `crm-project-${input.vorgangId}`,
        title: input.title,
        status: "In Vorbereitung",
        startedAt: input.date,
        vorgangId: input.vorgangId,
      });
    }
  }

  const draft = getReplyDraft(input.vorgangId);
  if (draft) {
    const replyItem: CrmTimelineEntry = {
      id: `crm-antwort-${input.vorgangId}`,
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
    };
    timeline = upsertTimelineItem(timeline, replyItem);
  }

  return { timeline, offers, invoices, appointments, documents, projects };
}

function buildCustomerFromInput(input: {
  email: string;
  ansprechpartner: string;
  firma: string;
  telefon: string;
  adresse: string;
  skill: HelpySkill;
  vorgangId: string;
  title: string;
  date: string;
  dateLabel: string;
  summary?: string;
  intentLabel?: string;
  existing?: HelpyCrmCustomer | null;
}): HelpyCrmCustomer {
  const now = new Date().toISOString();
  const matchInput = {
    email: input.email,
    telefon: input.telefon,
    firma: input.firma,
    ansprechpartner: input.ansprechpartner,
  };

  const existing =
    input.existing ??
    findCrmCustomerByMatch(matchInput);

  const id =
    existing?.id ??
    buildCrmCustomerId(matchInput);

  const derived = buildTimelineFromVorgang({
    vorgangId: input.vorgangId,
    title: input.title,
    date: input.date,
    dateLabel: input.dateLabel,
    summary: input.summary,
    intentLabel: input.intentLabel,
    skill: input.skill,
    existing: existing?.timeline ?? [],
  });

  return {
    id,
    ansprechpartner:
      input.ansprechpartner || existing?.ansprechpartner || "Unbekannt",
    firma: input.firma || existing?.firma || input.ansprechpartner,
    email: input.email || existing?.email || "—",
    telefon: input.telefon !== "—" ? input.telefon : existing?.telefon ?? "—",
    adresse: input.adresse !== "—" ? input.adresse : existing?.adresse ?? "—",
    branche: skillToBranche(input.skill),
    skill: input.skill,
    status: existing ? "bestandskunde" : "neu",
    notes: existing?.notes ?? [],
    projects: [...(existing?.projects ?? []), ...derived.projects],
    offers: [...(existing?.offers ?? []), ...derived.offers],
    invoices: [...(existing?.invoices ?? []), ...derived.invoices],
    appointments: [...(existing?.appointments ?? []), ...derived.appointments],
    documents: [...(existing?.documents ?? []), ...derived.documents],
    timeline: derived.timeline,
    vorgangIds: [
      input.vorgangId,
      ...(existing?.vorgangIds.filter((id) => id !== input.vorgangId) ?? []),
    ],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastContactAt: now,
  };
}

export function syncCrmFromGmailBundle(
  bundle: GmailVorgangBundle
): HelpyCrmCustomer | null {
  if (shouldPrepareArchive(bundle.liste)) return null;

  const email =
    extractSenderEmail(bundle.brain.from) ||
    extractSenderEmail(bundle.message.from) ||
    extractSenderEmail(bundle.liste.from ?? "");

  if (!email) return null;

  const customer = buildCustomerFromInput({
    email,
    ansprechpartner: extractSenderName(bundle.brain.from),
    firma: extractSenderName(bundle.brain.from),
    telefon: bundle.workspace.kunde.telefon,
    adresse: bundle.workspace.kunde.adresse,
    skill: bundle.workspace.skill,
    vorgangId: bundle.liste.id,
    title: bundle.liste.titel,
    date: bundle.liste.receivedAt,
    dateLabel: bundle.liste.receivedLabel,
    summary: bundle.brain.summary,
    intentLabel: bundle.brain.intent,
  });

  return upsertCrmCustomer(customer);
}

export function syncCrmFromWorkspaceVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): HelpyCrmCustomer | null {
  if (liste && shouldPrepareArchive(liste)) return null;

  const from = liste?.from ?? vorgang.letzteEmail.absender;
  const email = extractSenderEmail(from) || vorgang.kunde.email;

  if (!email || email === "—") return null;

  const customer = buildCustomerFromInput({
    email,
    ansprechpartner: vorgang.kunde.ansprechpartner || vorgang.kunde.firmenname,
    firma: vorgang.kunde.firmenname,
    telefon: vorgang.kunde.telefon,
    adresse: vorgang.kunde.adresse,
    skill: vorgang.skill,
    vorgangId: vorgang.id,
    title: vorgang.aufgabe.titel,
    date: liste?.receivedAt ?? new Date().toISOString(),
    dateLabel: liste?.receivedLabel ?? vorgang.letzteEmail.datum,
    summary: vorgang.letzteEmail.zusammenfassung,
    intentLabel: liste?.intentLabel ?? vorgang.aufgabe.kategorie,
  });

  return upsertCrmCustomer(customer);
}

export function syncCrmFromGmailBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    syncCrmFromGmailBundle(bundle);
  }
}

export function recordCrmGmailReplySent(
  vorgangId: string,
  subject: string
): void {
  const customers = getAllCrmCustomers();

  for (const customer of customers) {
    if (!customer.vorgangIds.includes(vorgangId)) continue;

    const sentItem: CrmTimelineEntry = {
      id: `crm-gmail-sent-${vorgangId}`,
      type: "antwort",
      title: `E-Mail gesendet: ${subject}`,
      date: new Date().toISOString(),
      dateLabel: "Gerade eben",
      summary: "Antwort wurde über Gmail versendet.",
      vorgangId,
      status: "gesendet",
    };

    const timeline = upsertTimelineItem(customer.timeline, sentItem);

    upsertCrmCustomer({
      ...customer,
      timeline,
      lastContactAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (/angebot|offert/i.test(subject)) {
      applyPipelineTrigger(vorgangId, "offerte-gesendet");
    }

    return;
  }
}

export function bootstrapCrmFromGmailCache(
  vorgaenge: ListeVorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): void {
  for (const liste of vorgaenge) {
    const workspace = workspaces[liste.id];
    if (workspace) {
      syncCrmFromWorkspaceVorgang(workspace, liste);
    }
  }
}
