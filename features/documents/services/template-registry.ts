import { MOCK_TEMPLATES } from "@/features/documents/services/mock-templates";
import type { DocumentTypeId, DocumentTemplate } from "@/features/documents/services/types";
import { buildSkillRecord } from "@/features/workspace/services/skills/skill-defaults";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeId, string> = {
  expose: "Exposé",
  besichtigungstermin: "Besichtigungstermin",
  besichtigungsprotokoll: "Besichtigungsprotokoll",
  reservationsbestaetigung: "Reservationsbestätigung",
  "kaufinteressenten-zusammenfassung": "Kaufinteressenten-Zusammenfassung",
  offerte: "Offerte",
  arbeitsrapport: "Arbeitsrapport",
  materialliste: "Materialliste",
  auftragsbestaetigung: "Auftragsbestätigung",
  angebot: "Angebot",
  mandatsbestaetigung: "Mandatsbestätigung",
  vollmacht: "Vollmacht",
  beratungsprotokoll: "Beratungsprotokoll",
  fristenuebersicht: "Fristenübersicht",
};

const REAL_ESTATE_DOCUMENTS: DocumentTypeId[] = [
  "expose",
  "besichtigungstermin",
  "besichtigungsprotokoll",
  "reservationsbestaetigung",
  "kaufinteressenten-zusammenfassung",
];

export const SKILL_DOCUMENT_TYPES: Record<HelpySkill, DocumentTypeId[]> =
  buildSkillRecord(
    {
      "real-estate": REAL_ESTATE_DOCUMENTS,
      construction: ["offerte", "arbeitsrapport", "materialliste", "auftragsbestaetigung"],
      "consulting-legal": [
        "angebot",
        "mandatsbestaetigung",
        "vollmacht",
        "beratungsprotokoll",
        "fristenuebersicht",
      ],
    },
    REAL_ESTATE_DOCUMENTS
  );

export function getDocumentTypeLabel(typeId: DocumentTypeId): string {
  return DOCUMENT_TYPE_LABELS[typeId];
}

export function getDocumentTypesForSkill(skill: HelpySkill): DocumentTypeId[] {
  return SKILL_DOCUMENT_TYPES[skill];
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return getAllTemplates().find((template) => template.id === id);
}

export function getTemplatesForSkill(skill: HelpySkill): DocumentTemplate[] {
  return getAllTemplates().filter((template) => template.skill === skill);
}

let templatesCache: DocumentTemplate[] | null = null;

export function registerTemplates(templates: DocumentTemplate[]): void {
  templatesCache = [...templates];
}

export function getAllTemplates(): DocumentTemplate[] {
  if (!templatesCache) {
    templatesCache = MOCK_TEMPLATES;
  }
  return templatesCache;
}

export function isTypeForSkill(
  typeId: DocumentTypeId,
  skill: HelpySkill
): boolean {
  return SKILL_DOCUMENT_TYPES[skill].includes(typeId);
}
