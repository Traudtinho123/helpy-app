import type {
  SkillTerminology,
  TerminologyBySkill,
} from "@/features/workspace/services/terminology/types";

const REAL_ESTATE: SkillTerminology = {
  customer: { singular: "Kunde", plural: "Kunden" },
  customerNew: { singular: "Neuer Kunde", plural: "Neue Kunden" },
  prospect: { singular: "Interessent", plural: "Interessenten" },
  portfolioItem: { singular: "Objekt", plural: "Objekte" },
  viewing: { singular: "Besichtigung", plural: "Besichtigungen" },
  offer: { singular: "Angebot", plural: "Angebote" },
  case: { singular: "Vorgang", plural: "Vorgänge" },
};

const CONSTRUCTION: SkillTerminology = {
  customer: { singular: "Kunde", plural: "Kunden" },
  customerNew: { singular: "Neuer Kunde", plural: "Neue Kunden" },
  prospect: { singular: "Kunde", plural: "Kunden" },
  portfolioItem: { singular: "Baustelle", plural: "Baustellen" },
  viewing: { singular: "Vor-Ort-Termin", plural: "Vor-Ort-Termine" },
  offer: { singular: "Offerte", plural: "Offerten" },
  case: { singular: "Auftrag", plural: "Aufträge" },
};

const CONSULTING_LEGAL: SkillTerminology = {
  customer: { singular: "Mandant", plural: "Mandanten" },
  customerNew: { singular: "Neuer Mandant", plural: "Neue Mandanten" },
  prospect: { singular: "Mandant", plural: "Mandanten" },
  portfolioItem: { singular: "Mandat", plural: "Mandate" },
  viewing: { singular: "Erstgespräch", plural: "Erstgespräche" },
  offer: { singular: "Angebot", plural: "Angebote" },
  case: { singular: "Fall", plural: "Fälle" },
};

/**
 * Zentrale Skill-Terminologie.
 * UI-Texte, die sich je Vertical unterscheiden, sollen darüber laufen.
 */
export const SKILL_TERMINOLOGY: TerminologyBySkill = {
  "real-estate": REAL_ESTATE,
  construction: CONSTRUCTION,
  "consulting-legal": CONSULTING_LEGAL,
};
