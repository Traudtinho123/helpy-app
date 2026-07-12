import {
  ALL_SKILLS,
  ALL_INDUSTRY_SKILLS,
  getAllSkillConfig,
  PUBLIC_SKILLS,
  SUPER_ADMIN_SKILLS,
  type IndustrySkillId,
  type SkillId,
} from "@/features/workspace/services/skills/all-skills";
import {
  ALL_HELPY_SKILL_IDS,
  buildSkillEmojiRecord,
  buildSkillRecord,
} from "@/features/workspace/services/skills/skill-defaults";

export type HelpySkill = SkillId;
export type { IndustrySkillId, SkillId };

export {
  ALL_SKILLS,
  ALL_INDUSTRY_SKILLS,
  PUBLIC_SKILLS,
  SUPER_ADMIN_SKILLS,
  getAllSkillConfig,
  getIndustrySkillConfig,
  getTerminology,
  isIndustrySkillId,
  isPreviewSkillId,
  isSkillId,
} from "@/features/workspace/services/skills/all-skills";

export const SKILL_EMOJI = buildSkillEmojiRecord();

export const HELPY_SKILL_ORDER: HelpySkill[] = [...ALL_HELPY_SKILL_IDS];

export type SkillTabId = string;

export type SkillTabDefinition = {
  id: SkillTabId;
  label: string;
};

export type SkillEmpfohleneAktion = {
  id: string;
  label: string;
};

export type HelpySkillConfig = {
  id: HelpySkill;
  label: string;
  emoji: string;
  tabs: SkillTabDefinition[];
  empfohleneAktionen: SkillEmpfohleneAktion[];
};

function buildGenericTabs(skill: HelpySkill): SkillTabDefinition[] {
  const config = ALL_SKILLS[skill];
  return [
    { id: "kunde", label: config.kunde },
    { id: "objekt", label: config.objekt },
    { id: "termin", label: config.termin },
    { id: "notizen", label: "Notizen" },
  ];
}

function buildGenericActions(skill: HelpySkill): SkillEmpfohleneAktion[] {
  const config = ALL_SKILLS[skill];
  return [
    { id: "hauptaktion", label: config.hauptaktion },
    { id: "kontaktieren", label: `${config.kunde} kontaktieren` },
    { id: "akte-oeffnen", label: `${config.kunde}akte öffnen` },
  ];
}

const LEGACY_SKILL_UI: Partial<
  Record<HelpySkill, Pick<HelpySkillConfig, "tabs" | "empfohleneAktionen">>
> = {
  "real-estate": {
    tabs: [
      { id: "interessent", label: "Interessent" },
      { id: "objekt", label: "Objekt" },
      { id: "besichtigung", label: "Besichtigung" },
      { id: "expose", label: "Exposé" },
      { id: "finanzierung", label: "Finanzierung" },
      { id: "notizen", label: "Notizen" },
    ],
    empfohleneAktionen: [
      { id: "besichtigung-planen", label: "Besichtigung planen" },
      { id: "interessent-kontaktieren", label: "Interessent kontaktieren" },
      { id: "expose-senden", label: "Exposé senden" },
      { id: "kundenakte-oeffnen", label: "Kundenakte öffnen" },
    ],
  },
  construction: {
    tabs: [
      { id: "kunde", label: "Kunde" },
      { id: "baustelle", label: "Baustelle" },
      { id: "offerte", label: "Offerte" },
      { id: "material", label: "Material" },
      { id: "termin", label: "Termin" },
      { id: "notizen", label: "Notizen" },
    ],
    empfohleneAktionen: [
      { id: "besichtigung-vor-ort", label: "Besichtigung vor Ort planen" },
      { id: "offerte-erstellen", label: "Offerte erstellen" },
      { id: "material-pruefen", label: "Material prüfen" },
      { id: "auftrag-vorbereiten", label: "Auftrag vorbereiten" },
    ],
  },
  "consulting-legal": {
    tabs: [
      { id: "mandant", label: "Mandant/Kunde" },
      { id: "projekt", label: "Projekt/Mandat" },
      { id: "fristen", label: "Fristen" },
      { id: "dokumente", label: "Dokumente" },
      { id: "erstgespraech", label: "Erstgespräch" },
      { id: "notizen", label: "Notizen" },
    ],
    empfohleneAktionen: [
      { id: "mandant-kontaktieren", label: "Mandant kontaktieren" },
      { id: "frist-sichern", label: "Frist sichern" },
      { id: "dokument-pruefen", label: "Dokument prüfen" },
      { id: "termin-vereinbaren", label: "Termin vereinbaren" },
      { id: "angebot-erstellen", label: "Angebot erstellen" },
    ],
  },
};

function buildHelpySkillConfig(skill: HelpySkill): HelpySkillConfig {
  const base = ALL_SKILLS[skill];
  const legacy = LEGACY_SKILL_UI[skill];
  return {
    id: skill,
    label: base.label,
    emoji: base.emoji,
    tabs: legacy?.tabs ?? buildGenericTabs(skill),
    empfohleneAktionen:
      legacy?.empfohleneAktionen ?? buildGenericActions(skill),
  };
}

export const HELPY_SKILLS: Record<HelpySkill, HelpySkillConfig> =
  Object.fromEntries(
    ALL_HELPY_SKILL_IDS.map((skill) => [skill, buildHelpySkillConfig(skill)])
  ) as Record<HelpySkill, HelpySkillConfig>;

export function getSkillConfig(skill: HelpySkill): HelpySkillConfig {
  return HELPY_SKILLS[skill];
}

export type SkillMonitorConfig = {
  label: string;
  emoji: string;
  monitoredAreas: string[];
  description: string;
};

const DEFAULT_MONITOR: SkillMonitorConfig = {
  label: "HELPY",
  emoji: "🤖",
  monitoredAreas: ["Mail", "Kalender", "Homepage", "Telefon"],
  description: "Ich überwache neue Anfragen und bereite Vorgänge automatisch vor.",
};

export const SKILL_MONITOR_CONFIG: Record<HelpySkill, SkillMonitorConfig> =
  buildSkillRecord(
    {
      "real-estate": {
        label: "HELPY Real Estate",
        emoji: "🏢",
        monitoredAreas: [
          "Mail",
          "ImmoScout24.ch",
          "WhatsApp",
          "Homepage",
          "Kalender",
          "Angebote",
        ],
        description:
          "Ich überwache deine Immobilienanfragen und bereite neue Vorgänge automatisch vor.",
      },
      construction: {
        label: "HELPY Construction",
        emoji: "🔨",
        monitoredAreas: [
          "Mail",
          "WhatsApp",
          "Homepage",
          "Kalender",
          "Offerten",
          "Baustellen",
        ],
        description:
          "Ich überwache neue Anfragen, Offerten und Baustellen-Vorgänge.",
      },
      "consulting-legal": {
        label: "HELPY Consulting & Legal",
        emoji: "⚖",
        monitoredAreas: [
          "Mail",
          "Homepage",
          "Kalender",
          "Dokumente",
          "Fristen",
          "Mandate",
        ],
        description:
          "Ich überwache neue Anfragen, Fristen und Mandanten-Vorgänge.",
      },
    },
    DEFAULT_MONITOR
  );

export function getSkillMonitorConfig(skill: HelpySkill): SkillMonitorConfig {
  return SKILL_MONITOR_CONFIG[skill];
}

export const DEFAULT_HELPY_SKILL: HelpySkill = "real-estate";
