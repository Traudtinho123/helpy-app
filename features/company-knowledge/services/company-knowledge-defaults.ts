import type {
  BusinessDayHours,
  CompanyKnowledge,
  WeekdayId,
} from "@/features/company-knowledge/types/company-knowledge-types";
import { WEEKDAY_ORDER } from "@/features/company-knowledge/types/company-knowledge-types";

export function createDefaultBusinessHours(): Record<WeekdayId, BusinessDayHours> {
  const weekdayHours: BusinessDayHours = {
    closed: false,
    start: "09:00",
    end: "18:00",
  };
  const weekendClosed: BusinessDayHours = {
    closed: true,
    start: "09:00",
    end: "12:00",
  };

  return {
    monday: { ...weekdayHours },
    tuesday: { ...weekdayHours },
    wednesday: { ...weekdayHours },
    thursday: { ...weekdayHours },
    friday: { ...weekdayHours },
    saturday: { ...weekendClosed },
    sunday: { ...weekendClosed },
  };
}

export function createEmptyCompanyKnowledge(
  companyId: string,
  updatedBy = ""
): CompanyKnowledge {
  return {
    companyId,
    companyDescription: "",
    services: [],
    locations: [],
    businessHours: createDefaultBusinessHours(),
    replyStyle: "friendly-professional",
    replyStyleCustom: "",
    emailSignatureOverride: "",
    appointmentDurationViewingMinutes: 45,
    appointmentDurationConsultationMinutes: 30,
    appointmentDurationOnSiteMinutes: 60,
    defaultBufferMinutes: 15,
    internalRules: [],
    faq: [],
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
}

export function cloneCompanyKnowledge(
  knowledge: CompanyKnowledge
): CompanyKnowledge {
  return {
    ...knowledge,
    services: knowledge.services.map((item) => ({ ...item })),
    locations: [...knowledge.locations],
    businessHours: Object.fromEntries(
      WEEKDAY_ORDER.map((day) => [
        day,
        { ...knowledge.businessHours[day] },
      ])
    ) as CompanyKnowledge["businessHours"],
    internalRules: [...knowledge.internalRules],
    faq: knowledge.faq.map((item) => ({ ...item })),
  };
}

export function companyKnowledgeEquals(
  left: CompanyKnowledge,
  right: CompanyKnowledge
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
