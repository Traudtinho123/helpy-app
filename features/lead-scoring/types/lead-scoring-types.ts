export type LeadScoreBand = "cold" | "warm" | "hot";

export type LeadScoreRecord = {
  customerKey: string;
  email: string | null;
  score: number;
  updatedAt: string;
};

export type LeadScoreInput = {
  customerKey: string;
  email: string | null;
  lastContactAt: string | null;
  vorgangCount: number;
  hasExplicitBudget: boolean;
  hasLocationCriteria: boolean;
  repliedToHelpy: boolean;
  hasViewingRequest: boolean;
  multipleInquiriesSameObject: boolean;
  unansweredInquiries: boolean;
  onlyGenericQuestions: boolean;
};

export type LeadScoreCustomerRef = {
  id: string;
  email: string;
  company?: string;
  contactPerson?: string;
  lastActivity?: string;
  vorgangId?: string;
};

export const LEAD_SCORE_STALE_MS = 12 * 60 * 60 * 1000;

export const LEAD_SCORE_TOOLTIP =
  "Score basiert auf Kommunikationsaktivität, genannten Kriterien und Reaktionszeit";
