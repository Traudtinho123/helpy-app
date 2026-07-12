import {
  getAppointmentSuggestion,
  isAppointmentVorgang,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { readPlatformContextValue } from "@/features/brain/services/platform-inquiry-context";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import { peekKundenakteByVorgangId } from "@/features/kundenakte/services/kundenakte-store";
import { getStatusSnapshotById } from "@/features/workspace/services/status/status-engine";
import { buildSkillRecord } from "@/features/workspace/services/skills/skill-defaults";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export type GmailWorkflowActionKind =
  | "kundenakte"
  | "objekt"
  | "termin"
  | "expose"
  | "antwort"
  | "checkliste"
  | "offerte"
  | "materialliste"
  | "frist"
  | "dokument"
  | "erstgespraech";

export type GmailWorkflowStepVisualStatus =
  | "vorbereitet"
  | "in-pruefung"
  | "bestaetigt"
  | "erledigt";

export type GmailWorkflowStepDefinition = {
  id: string;
  title: string;
  description: string;
  actionKind: GmailWorkflowActionKind;
  actionLabel: string;
  actionLabelIfIncomplete?: string;
  /** Wenn false, Schritt wird ausgeblendet. */
  isRelevant: (ctx: GmailWorkflowStepContext) => boolean;
  hasEnoughData: (ctx: GmailWorkflowStepContext) => boolean;
};

export type GmailWorkflowStepContext = {
  vorgang: WorkspaceVorgang;
  liste?: ListeVorgang;
  skill: HelpySkill;
  isPlatformInquiry: boolean;
};

export type ResolvedGmailWorkflowStep = GmailWorkflowStepDefinition & {
  buttonLabel: string;
  status: GmailWorkflowStepVisualStatus;
  incomplete: boolean;
};

export const WORKFLOW_STEP_STATUS_LABELS: Record<
  GmailWorkflowStepVisualStatus,
  string
> = {
  vorbereitet: "Vorbereitet",
  "in-pruefung": "In Prüfung",
  bestaetigt: "Bestätigt",
  erledigt: "Erledigt",
};

const ANGABEN_ERGAENZEN = "Angaben ergänzen";

function hasContactData(ctx: GmailWorkflowStepContext): boolean {
  const email = ctx.vorgang.kunde.email;
  const name = ctx.vorgang.kunde.ansprechpartner ?? ctx.vorgang.kunde.firmenname;
  return Boolean(name && name !== "—" && email && email !== "—");
}

function hasObjektData(ctx: GmailWorkflowStepContext): boolean {
  return Boolean(
    readPlatformContextValue(ctx.liste?.detectedContext, "Objekt") ??
      readPlatformContextValue(ctx.liste?.detectedContext, "Adresse")
  );
}

function matchesIntent(ctx: GmailWorkflowStepContext, keys: string[]): boolean {
  const haystack = [
    ctx.liste?.intent,
    ctx.liste?.intentLabel,
    ctx.liste?.typ,
    ctx.vorgang.kopfzeile?.intentLabel,
    ctx.vorgang.aufgabe.kategorie,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keys.some((key) => haystack.includes(key.toLowerCase()));
}

function resolveReplyStepStatus(vorgangId: string): GmailWorkflowStepVisualStatus {
  const draft = getReplyDraft(vorgangId);
  const currentStatus =
    getStatusSnapshotById(vorgangId)?.currentStatus ?? "von-helpy-vorbereitet";

  if (currentStatus === "wartet-auf-rueckmeldung") return "erledigt";
  if (draft?.status === "uebernommen" || draft?.status === "bestaetigt") {
    return draft.status === "bestaetigt" ? "bestaetigt" : "erledigt";
  }
  if (draft?.status === "bearbeitet") return "in-pruefung";
  return "vorbereitet";
}

function resolveKundenakteStepStatus(
  vorgangId: string
): GmailWorkflowStepVisualStatus {
  const akte = peekKundenakteByVorgangId(vorgangId);
  if (!akte) return "vorbereitet";
  if (akte.status === "bestaetigt") return "bestaetigt";
  if (akte.status === "bearbeitet") return "in-pruefung";
  return "vorbereitet";
}

function resolveTerminStepStatus(vorgangId: string): GmailWorkflowStepVisualStatus {
  const suggestion = getAppointmentSuggestion(vorgangId);
  if (!suggestion) return "vorbereitet";
  if (suggestion.confirmationStatus === "saved_to_calendar") return "erledigt";
  if (suggestion.status === "bestaetigt") return "bestaetigt";
  if (suggestion.viewingConfirmation) return "in-pruefung";
  if (suggestion.status === "vorbereitet" && suggestion.slots.length > 0) {
    return "in-pruefung";
  }
  return "vorbereitet";
}

function resolveGenericStepStatus(
  actionKind: GmailWorkflowActionKind,
  ctx: GmailWorkflowStepContext
): GmailWorkflowStepVisualStatus {
  switch (actionKind) {
    case "kundenakte":
      return resolveKundenakteStepStatus(ctx.vorgang.id);
    case "antwort":
      return resolveReplyStepStatus(ctx.vorgang.id);
    case "termin":
    case "erstgespraech":
      return resolveTerminStepStatus(ctx.vorgang.id);
    default:
      return "vorbereitet";
  }
}

const REAL_ESTATE_STEPS: GmailWorkflowStepDefinition[] = [
  {
    id: "re-interessent",
    title: "Interessent",
    description: "Kontaktdaten und Anfrage gegenprüfen.",
    actionKind: "kundenakte",
    actionLabel: "Kundenakte öffnen",
    isRelevant: () => true,
    hasEnoughData: hasContactData,
  },
  {
    id: "re-objekt",
    title: "Objekt",
    description: "Objekt und Bezug zur Anfrage prüfen.",
    actionKind: "objekt",
    actionLabel: "Objekt prüfen",
    isRelevant: (ctx) => ctx.isPlatformInquiry || ctx.liste?.typ === "anfrage",
    hasEnoughData: hasObjektData,
  },
  {
    id: "re-besichtigung",
    title: "Besichtigung",
    description: "Freie Termine vorschlagen und Termin bestätigen.",
    actionKind: "termin",
    actionLabel: "Termin buchen",
    isRelevant: (ctx) =>
      isAppointmentVorgang(ctx.vorgang, ctx.liste) ||
      Boolean(readPlatformContextValue(ctx.liste?.detectedContext, "Besichtigung")),
    hasEnoughData: () => true,
  },
  {
    id: "re-expose",
    title: "Exposé",
    description: "Exposé-Entwurf prüfen oder ergänzen.",
    actionKind: "expose",
    actionLabel: "Exposé anzeigen",
    actionLabelIfIncomplete: "Exposé erstellen",
    isRelevant: (ctx) => ctx.isPlatformInquiry || ctx.liste?.typ === "anfrage",
    hasEnoughData: hasObjektData,
  },
  {
    id: "re-antwort",
    title: "Antwort",
    description: "Antwortentwurf prüfen und nach Bestätigung senden.",
    actionKind: "antwort",
    actionLabel: "Antwort prüfen",
    isRelevant: () => true,
    hasEnoughData: hasContactData,
  },
];

const CONSTRUCTION_STEPS: GmailWorkflowStepDefinition[] = [
  {
    id: "hw-kunde",
    title: "Kunde",
    description: "Ansprechpartner und Anliegen festhalten.",
    actionKind: "kundenakte",
    actionLabel: "Kundenakte öffnen",
    isRelevant: () => true,
    hasEnoughData: hasContactData,
  },
  {
    id: "hw-baustelle",
    title: "Baustelle",
    description: "Adresse, Arbeiten, Zeitraum, Budget und offene Fragen prüfen.",
    actionKind: "checkliste",
    actionLabel: "Checkliste öffnen",
    isRelevant: (ctx) =>
      matchesIntent(ctx, ["baustelle", "sanierung", "umbau", "projekt", "offert"]),
    hasEnoughData: (ctx) =>
      Boolean(ctx.vorgang.kunde.adresse && ctx.vorgang.kunde.adresse !== "—") ||
      matchesIntent(ctx, ["baustelle", "projekt"]),
  },
  {
    id: "hw-vor-ort",
    title: "Vor-Ort-Termin",
    description: "Besichtigung und Checkliste vorbereiten.",
    actionKind: "termin",
    actionLabel: "Termin buchen",
    isRelevant: (ctx) =>
      isAppointmentVorgang(ctx.vorgang, ctx.liste) ||
      matchesIntent(ctx, ["besichtigung", "termin", "vor-ort"]),
    hasEnoughData: () => true,
  },
  {
    id: "hw-offerte",
    title: "Offerte",
    description: "Angebotspositionen als Entwurf zusammenstellen.",
    actionKind: "offerte",
    actionLabel: "Offerte erstellen",
    isRelevant: (ctx) =>
      matchesIntent(ctx, ["offert", "angebot", "kostenvoranschlag"]) ||
      ctx.liste?.typ === "angebotsanfrage",
    hasEnoughData: hasContactData,
  },
  {
    id: "hw-materialliste",
    title: "Materialliste",
    description: "Materialbedarf und Positionen vorbereiten.",
    actionKind: "materialliste",
    actionLabel: "Materialliste öffnen",
    isRelevant: (ctx) => matchesIntent(ctx, ["material", "baustelle", "sanierung"]),
    hasEnoughData: hasContactData,
  },
];

const CONSULTING_STEPS: GmailWorkflowStepDefinition[] = [
  {
    id: "cl-mandant",
    title: "Kunde / Mandant",
    description: "Kontakt und Anliegen in der Akte erfassen.",
    actionKind: "kundenakte",
    actionLabel: "Kundenakte öffnen",
    isRelevant: () => true,
    hasEnoughData: hasContactData,
  },
  {
    id: "cl-frist",
    title: "Frist",
    description: "Relevante Fristen erkennen und sichern.",
    actionKind: "frist",
    actionLabel: "Frist prüfen",
    isRelevant: (ctx) =>
      matchesIntent(ctx, ["frist", "deadline", "einspruch"]) ||
      ctx.liste?.typ === "frist",
    hasEnoughData: () => true,
  },
  {
    id: "cl-dokument",
    title: "Dokument",
    description: "Unterlagen und Checkliste sammeln.",
    actionKind: "dokument",
    actionLabel: "Dokument öffnen",
    isRelevant: (ctx) =>
      matchesIntent(ctx, ["dokument", "unterlagen", "pdf", "anhang"]),
    hasEnoughData: () => true,
  },
  {
    id: "cl-erstgespraech",
    title: "Erstgespräch",
    description: "Terminvorschlag und Gesprächsleitfaden vorbereiten.",
    actionKind: "erstgespraech",
    actionLabel: "Termin buchen",
    isRelevant: (ctx) =>
      isAppointmentVorgang(ctx.vorgang, ctx.liste) ||
      matchesIntent(ctx, ["erstgespräch", "erstgespraech", "termin", "beratung"]),
    hasEnoughData: () => true,
  },
  {
    id: "cl-antwort",
    title: "Antwort",
    description: "Antwortentwurf prüfen und nach Bestätigung senden.",
    actionKind: "antwort",
    actionLabel: "Antwort prüfen",
    isRelevant: () => true,
    hasEnoughData: hasContactData,
  },
];

const STEPS_BY_SKILL: Record<HelpySkill, GmailWorkflowStepDefinition[]> =
  buildSkillRecord(
    {
      "real-estate": REAL_ESTATE_STEPS,
      construction: CONSTRUCTION_STEPS,
      "consulting-legal": CONSULTING_STEPS,
    },
    REAL_ESTATE_STEPS
  );

export function buildGmailWorkflowStepContext(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): GmailWorkflowStepContext {
  const quelle = liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail";
  return {
    vorgang,
    liste,
    skill: vorgang.skill,
    isPlatformInquiry: isPlatformRealEstateQuelle(quelle),
  };
}

export function resolveGmailWorkflowSteps(
  ctx: GmailWorkflowStepContext
): ResolvedGmailWorkflowStep[] {
  const definitions = STEPS_BY_SKILL[ctx.skill] ?? REAL_ESTATE_STEPS;

  return definitions
    .filter((step) => step.isRelevant(ctx))
    .map((step) => {
      const incomplete = !step.hasEnoughData(ctx);
      const buttonLabel = incomplete
        ? ANGABEN_ERGAENZEN
        : step.actionLabel;

      return {
        ...step,
        buttonLabel,
        status: resolveGenericStepStatus(step.actionKind, ctx),
        incomplete,
      };
    });
}

/** @deprecated Nutze resolveGmailWorkflowSteps */
export function getGmailWorkflowSteps(skill: HelpySkill): GmailWorkflowStepDefinition[] {
  return STEPS_BY_SKILL[skill] ?? REAL_ESTATE_STEPS;
}
