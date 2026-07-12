/** Zentrale Skill-Konfiguration — Terminologie, Navigation, Intents. */

export type IndustrySkillId =
  | "real-estate"
  | "coiffeur"
  | "gym"
  | "doctor"
  | "cosmetic"
  | "physio"
  | "gastro"
  | "clean"
  | "garden";

export type LegacySkillId = "construction" | "consulting-legal";

export type SkillId = IndustrySkillId | LegacySkillId;

export type SkillNavLabels = {
  objekte: string;
  kalender: string;
  kunden: string;
  vorgaenge?: string;
};

export type SkillConfig = {
  id: SkillId;
  label: string;
  emoji: string;
  kunde: string;
  kunden: string;
  objekt: string;
  objekte: string;
  vorgang: string;
  vorgaenge: string;
  termin: string;
  termine: string;
  hauptaktion: string;
  intents: string[];
  nav: SkillNavLabels;
};

export const PUBLIC_SKILLS: IndustrySkillId[] = ["real-estate"];

export const SUPER_ADMIN_SKILLS: IndustrySkillId[] = [
  "real-estate",
  "coiffeur",
  "gym",
  "doctor",
  "cosmetic",
  "physio",
  "gastro",
  "clean",
  "garden",
];

export const ALL_INDUSTRY_SKILLS: Record<IndustrySkillId, SkillConfig> = {
  "real-estate": {
    id: "real-estate",
    label: "HELPY Real Estate",
    emoji: "🏢",
    kunde: "Interessent",
    kunden: "Interessenten",
    objekt: "Objekt",
    objekte: "Objekte",
    vorgang: "Vorgang",
    vorgaenge: "Vorgänge",
    termin: "Besichtigung",
    termine: "Besichtigungen",
    hauptaktion: "Besichtigung vereinbaren",
    intents: [
      "besichtigung_anfrage",
      "kaufanfrage",
      "mietanfrage",
      "info_anfrage",
      "portal_anfrage",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Objekte",
      kalender: "Kalender",
      kunden: "Interessenten",
      vorgaenge: "Vorgänge",
    },
  },
  coiffeur: {
    id: "coiffeur",
    label: "HELPY Hair & Beauty",
    emoji: "✂️",
    kunde: "Kunde",
    kunden: "Kunden",
    objekt: "Dienstleistung",
    objekte: "Dienstleistungen",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Termin",
    termine: "Termine",
    hauptaktion: "Termin buchen",
    intents: [
      "terminanfrage",
      "terminverschiebung",
      "preisanfrage",
      "reklamation",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Dienstleistungen",
      kalender: "Termine",
      kunden: "Kunden",
    },
  },
  gym: {
    id: "gym",
    label: "HELPY Fitness & Gym",
    emoji: "💪",
    kunde: "Mitglied",
    kunden: "Mitglieder",
    objekt: "Kurs",
    objekte: "Kurse",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Kurs/Training",
    termine: "Kurse",
    hauptaktion: "Kurs buchen",
    intents: [
      "mitgliedschaft_anfrage",
      "kurs_buchung",
      "kuendigung",
      "preisanfrage",
      "personal_training",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Kurse",
      kalender: "Trainingsplan",
      kunden: "Mitglieder",
    },
  },
  doctor: {
    id: "doctor",
    label: "HELPY Medical",
    emoji: "🏥",
    kunde: "Patient",
    kunden: "Patienten",
    objekt: "Behandlung",
    objekte: "Behandlungen",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Konsultation",
    termine: "Konsultationen",
    hauptaktion: "Termin buchen",
    intents: [
      "terminanfrage",
      "rezept_anfrage",
      "ueberweisung",
      "notfall",
      "ergebnis_anfrage",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Behandlungen",
      kalender: "Sprechstunden",
      kunden: "Patienten",
    },
  },
  cosmetic: {
    id: "cosmetic",
    label: "HELPY Cosmetics",
    emoji: "💄",
    kunde: "Kundin",
    kunden: "Kundinnen",
    objekt: "Behandlung",
    objekte: "Behandlungen",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Behandlung",
    termine: "Behandlungen",
    hauptaktion: "Behandlung buchen",
    intents: [
      "terminanfrage",
      "beratungsanfrage",
      "preisanfrage",
      "produktanfrage",
      "reklamation",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Behandlungen",
      kalender: "Termine",
      kunden: "Kundinnen",
    },
  },
  physio: {
    id: "physio",
    label: "HELPY Physio",
    emoji: "🦴",
    kunde: "Patient",
    kunden: "Patienten",
    objekt: "Therapie",
    objekte: "Therapien",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Therapietermin",
    termine: "Therapietermine",
    hauptaktion: "Therapietermin buchen",
    intents: [
      "ersttermin_anfrage",
      "folgetermin",
      "krankenkassen_anfrage",
      "ueberweisung",
      "hausbesuch_anfrage",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Therapien",
      kalender: "Therapieplan",
      kunden: "Patienten",
    },
  },
  gastro: {
    id: "gastro",
    label: "HELPY Restaurant",
    emoji: "🍽️",
    kunde: "Gast",
    kunden: "Gäste",
    objekt: "Tisch/Event",
    objekte: "Reservationen",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Reservation",
    termine: "Reservationen",
    hauptaktion: "Tisch reservieren",
    intents: [
      "tischreservation",
      "event_anfrage",
      "menü_anfrage",
      "take_away",
      "catering",
      "reklamation",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Reservationen",
      kalender: "Belegungsplan",
      kunden: "Stammgäste",
    },
  },
  clean: {
    id: "clean",
    label: "HELPY Cleaning",
    emoji: "🧹",
    kunde: "Auftraggeber",
    kunden: "Auftraggeber",
    objekt: "Objekt/Auftrag",
    objekte: "Aufträge",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Reinigungseinsatz",
    termine: "Reinigungseinsätze",
    hauptaktion: "Reinigung anfragen",
    intents: [
      "offerten_anfrage",
      "reinigung_buchen",
      "sondereinsatz",
      "reklamation",
      "dauerauftrag",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Aufträge",
      kalender: "Einsatzplan",
      kunden: "Auftraggeber",
    },
  },
  garden: {
    id: "garden",
    label: "HELPY Garden",
    emoji: "🌿",
    kunde: "Kunde",
    kunden: "Kunden",
    objekt: "Projekt",
    objekte: "Projekte",
    vorgang: "Anfrage",
    vorgaenge: "Anfragen",
    termin: "Einsatz",
    termine: "Einsätze",
    hauptaktion: "Offerte anfragen",
    intents: [
      "offerten_anfrage",
      "pflege_auftrag",
      "neugestaltung",
      "saisonal",
      "notfalleinsatz",
      "rueckruf_wunsch",
      "sonstiges",
    ],
    nav: {
      objekte: "Projekte",
      kalender: "Einsatzplan",
      kunden: "Kunden",
    },
  },
};

const LEGACY_SKILL_CONFIGS: Record<LegacySkillId, SkillConfig> = {
  construction: {
    id: "construction",
    label: "HELPY Construction",
    emoji: "🔨",
    kunde: "Kunde",
    kunden: "Kunden",
    objekt: "Baustelle",
    objekte: "Baustellen",
    vorgang: "Auftrag",
    vorgaenge: "Aufträge",
    termin: "Vor-Ort-Termin",
    termine: "Vor-Ort-Termine",
    hauptaktion: "Besichtigung vor Ort planen",
    intents: ["offerten_anfrage", "auftragsanfrage", "rueckruf_wunsch", "sonstiges"],
    nav: {
      objekte: "Baustellen",
      kalender: "Kalender",
      kunden: "Kunden",
    },
  },
  "consulting-legal": {
    id: "consulting-legal",
    label: "HELPY Consulting & Legal",
    emoji: "⚖",
    kunde: "Mandant",
    kunden: "Mandanten",
    objekt: "Mandat",
    objekte: "Mandate",
    vorgang: "Fall",
    vorgaenge: "Fälle",
    termin: "Erstgespräch",
    termine: "Erstgespräche",
    hauptaktion: "Termin vereinbaren",
    intents: ["mandatsanfrage", "frist", "dokument", "rueckruf_wunsch", "sonstiges"],
    nav: {
      objekte: "Mandate",
      kalender: "Kalender",
      kunden: "Mandanten",
    },
  },
};

export const ALL_SKILLS: Record<SkillId, SkillConfig> = {
  ...ALL_INDUSTRY_SKILLS,
  ...LEGACY_SKILL_CONFIGS,
};

export type SkillTerminologyKey =
  | "kunde"
  | "kunden"
  | "objekt"
  | "objekte"
  | "vorgang"
  | "vorgaenge"
  | "termin"
  | "termine"
  | "hauptaktion";

export function isIndustrySkillId(value: string): value is IndustrySkillId {
  return value in ALL_INDUSTRY_SKILLS;
}

export function isSkillId(value: string): value is SkillId {
  return value in ALL_SKILLS;
}

export function isPreviewSkillId(value: string): value is IndustrySkillId {
  return isIndustrySkillId(value);
}

export function getIndustrySkillConfig(skillId: IndustrySkillId): SkillConfig {
  return ALL_INDUSTRY_SKILLS[skillId];
}

export function getAllSkillConfig(skillId: SkillId): SkillConfig {
  return ALL_SKILLS[skillId];
}

export function getTerminology(
  skillId: SkillId,
  key: SkillTerminologyKey
): string {
  return ALL_SKILLS[skillId][key];
}

/** Generische Intent-Labels für Branchen-Skills ohne spezifische KI-Logik. */
export const GENERIC_INDUSTRY_INTENT_LABELS: Record<string, string> = {
  terminanfrage: "Terminanfrage",
  info_anfrage: "Info-Anfrage",
  rueckruf_wunsch: "Rückruf gewünscht",
  reklamation: "Reklamation",
  sonstiges: "Sonstiges",
};
