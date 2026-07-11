import type { CompanyKnowledge } from "@/features/company-knowledge/types/company-knowledge-types";
import { WEEKDAY_ORDER } from "@/features/company-knowledge/types/company-knowledge-types";

export type CompanyKnowledgeValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value.trim());
}

export function validateCompanyKnowledge(
  knowledge: CompanyKnowledge
): CompanyKnowledgeValidationResult {
  const errors: string[] = [];

  if (!knowledge.companyId.trim()) {
    errors.push("Unternehmens-ID fehlt.");
  }

  for (const service of knowledge.services) {
    if (!service.name.trim()) {
      errors.push("Jede Dienstleistung braucht einen Namen.");
      break;
    }
  }

  for (const entry of knowledge.faq) {
    if (!entry.question.trim() || !entry.answer.trim()) {
      errors.push("FAQ-Einträge brauchen Frage und Antwort.");
      break;
    }
  }

  if (
    knowledge.replyStyle === "custom" &&
    !knowledge.replyStyleCustom.trim()
  ) {
    errors.push("Bitte den individuellen Antwortstil beschreiben.");
  }

  for (const day of WEEKDAY_ORDER) {
    const hours = knowledge.businessHours[day];
    if (hours.closed) continue;
    if (!isValidTime(hours.start) || !isValidTime(hours.end)) {
      errors.push(`Arbeitszeiten für ${day} sind ungültig (Format HH:MM).`);
      break;
    }
    if (hours.start >= hours.end) {
      errors.push("Startzeit muss vor der Endzeit liegen.");
      break;
    }
  }

  const durations = [
    knowledge.appointmentDurationViewingMinutes,
    knowledge.appointmentDurationConsultationMinutes,
    knowledge.appointmentDurationOnSiteMinutes,
    knowledge.defaultBufferMinutes,
  ];

  if (durations.some((value) => !Number.isFinite(value) || value <= 0)) {
    errors.push("Termindauern und Puffer müssen größer als 0 sein.");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
