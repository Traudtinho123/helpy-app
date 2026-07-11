import { describe, expect, it } from "vitest";
import { calculateLeadScore } from "@/features/lead-scoring/services/lead-score-engine";
import type { LeadScoreInput } from "@/features/lead-scoring/types/lead-scoring-types";

const NOW = new Date("2026-07-11T10:00:00.000Z");

function baseInput(overrides: Partial<LeadScoreInput> = {}): LeadScoreInput {
  return {
    customerKey: "customer-test@example.com",
    email: "test@example.com",
    lastContactAt: null,
    vorgangCount: 0,
    hasExplicitBudget: false,
    hasLocationCriteria: false,
    repliedToHelpy: false,
    hasViewingRequest: false,
    multipleInquiriesSameObject: false,
    unansweredInquiries: false,
    onlyGenericQuestions: false,
    ...overrides,
  };
}

describe("calculateLeadScore", () => {
  it("returns neutral 5 for empty leads", () => {
    expect(
      calculateLeadScore(
        baseInput({ email: null, vorgangCount: 0, lastContactAt: null }),
        NOW
      )
    ).toBe(5);
  });

  it("scores active leads with criteria higher than inactive generic leads", () => {
    const activeLead = calculateLeadScore(
      baseInput({
        lastContactAt: "2026-07-09T10:00:00.000Z",
        vorgangCount: 2,
        hasExplicitBudget: true,
        hasLocationCriteria: true,
        hasViewingRequest: true,
        repliedToHelpy: true,
      }),
      NOW
    );

    const inactiveLead = calculateLeadScore(
      baseInput({
        lastContactAt: "2026-06-01T10:00:00.000Z",
        vorgangCount: 1,
        onlyGenericQuestions: true,
        unansweredInquiries: true,
      }),
      NOW
    );

    expect(activeLead).toBeGreaterThan(inactiveLead);
    expect(activeLead).toBeGreaterThanOrEqual(7);
    expect(inactiveLead).toBeLessThanOrEqual(4);
  });

  it("clamps score between 1 and 10", () => {
    const maxScore = calculateLeadScore(
      baseInput({
        lastContactAt: "2026-07-10T10:00:00.000Z",
        hasExplicitBudget: true,
        hasLocationCriteria: true,
        repliedToHelpy: true,
        hasViewingRequest: true,
        multipleInquiriesSameObject: true,
      }),
      NOW
    );

    const minScore = calculateLeadScore(
      baseInput({
        lastContactAt: "2026-05-01T10:00:00.000Z",
        unansweredInquiries: true,
        onlyGenericQuestions: true,
      }),
      NOW
    );

    expect(maxScore).toBeLessThanOrEqual(10);
    expect(minScore).toBeGreaterThanOrEqual(1);
  });
});
