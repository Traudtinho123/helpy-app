export type {
  BusinessDayHours,
  CompanyKnowledge,
  CompanyKnowledgeFaqEntry,
  CompanyKnowledgeService,
  ReplyStyleId,
  ResolvedCompanyKnowledge,
  WeekdayId,
} from "@/features/company-knowledge/types/company-knowledge-types";

export {
  REPLY_STYLE_LABELS,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from "@/features/company-knowledge/types/company-knowledge-types";

export { CompanyKnowledgeForm } from "@/features/company-knowledge/components/company-knowledge-form";

export {
  buildCompanyKnowledgeContextLines,
  buildCompanyKnowledgeDecisionSupplement,
  buildCompanyKnowledgePromptBlock,
  resolveCompanyKnowledge,
  resolveReplyStyleLabel,
  summarizeBusinessHours,
} from "@/features/company-knowledge/services/company-knowledge-context";

export {
  cloneCompanyKnowledge,
  companyKnowledgeEquals,
  createDefaultBusinessHours,
  createEmptyCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-defaults";

export {
  ensureCompanyKnowledgeLoaded,
  getCompanyKnowledge,
  getCompanyKnowledgeLoadError,
  getCompanyKnowledgeSnapshot,
  isCompanyKnowledgeLoading,
  resetCompanyKnowledgeDraftSource,
  saveCompanyKnowledge,
  subscribeCompanyKnowledgeStore,
} from "@/features/company-knowledge/services/company-knowledge-service";

export type {
  CompanyKnowledgeLoadResult,
  CompanyKnowledgeSaveResult,
} from "@/features/company-knowledge/services/company-knowledge-service";

export { validateCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-validator";

export { MOCK_COMPANY_KNOWLEDGE } from "@/features/company-knowledge/mock/company-knowledge-mock";
