import type { LeadScoreBand, LeadScoreInput } from "@/features/lead-scoring/types/lead-scoring-types";

export const LEAD_SCORE_BASE = 5;
export const LEAD_SCORE_MIN = 1;
export const LEAD_SCORE_MAX = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clampScore(value: number): number {
  return Math.min(LEAD_SCORE_MAX, Math.max(LEAD_SCORE_MIN, Math.round(value)));
}

function daysSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return null;
  return (now.getTime() - timestamp) / MS_PER_DAY;
}

export function resolveLeadScoreBand(score: number): LeadScoreBand {
  if (score <= 3) return "cold";
  if (score <= 6) return "warm";
  return "hot";
}

/** Regelbasiertes Lead-Scoring — Start bei 5, dann +/- nach Aktivität & Kriterien. */
export function calculateLeadScore(
  input: LeadScoreInput,
  now: Date = new Date()
): number {
  if (!input.email && input.vorgangCount === 0 && !input.lastContactAt) {
    return LEAD_SCORE_BASE;
  }

  let score = LEAD_SCORE_BASE;
  const lastContactDays = daysSince(input.lastContactAt, now);

  if (lastContactDays !== null && lastContactDays <= 7) {
    score += 2;
  }

  if (input.hasExplicitBudget) score += 2;
  if (input.hasLocationCriteria) score += 1;
  if (input.repliedToHelpy) score += 1;
  if (input.hasViewingRequest) score += 1;
  if (input.multipleInquiriesSameObject) score += 1;

  if (lastContactDays !== null && lastContactDays > 14) {
    score -= 2;
  }

  if (input.unansweredInquiries) score -= 1;
  if (input.onlyGenericQuestions) score -= 1;

  return clampScore(score);
}
