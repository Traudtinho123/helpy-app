export type HelpySkill = "real-estate" | "construction" | "consulting-legal";

export const SKILL_EMOJI: Record<HelpySkill, string> = {
  "real-estate": "🏡",
  construction: "🔨",
  "consulting-legal": "⚖",
};

export const HELPY_SKILL_ORDER: HelpySkill[] = [
  "real-estate",
  "construction",
  "consulting-legal",
];

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
  tabs: SkillTabDefinition[];
  empfohleneAktionen: SkillEmpfohleneAktion[];
};

export const HELPY_SKILLS: Record<HelpySkill, HelpySkillConfig> = {
  "real-estate": {
    id: "real-estate",
    label: "HELPY Real Estate",
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
    id: "construction",
    label: "HELPY Construction",
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
    id: "consulting-legal",
    label: "HELPY Consulting & Legal",
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

export function getSkillConfig(skill: HelpySkill): HelpySkillConfig {
  return HELPY_SKILLS[skill];
}

export type SkillMonitorConfig = {
  label: string;
  emoji: string;
  monitoredAreas: string[];
  description: string;
};

export const SKILL_MONITOR_CONFIG: Record<HelpySkill, SkillMonitorConfig> = {
  "real-estate": {
    label: "HELPY Real Estate",
    emoji: "🏡",
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
};

export function getSkillMonitorConfig(skill: HelpySkill): SkillMonitorConfig {
  return SKILL_MONITOR_CONFIG[skill];
}

export const DEFAULT_HELPY_SKILL: HelpySkill = "real-estate";
