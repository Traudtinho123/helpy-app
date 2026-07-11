import type { PreparedHelpyAction } from "@/features/review/services/actions/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { buildMockReview } from "@/features/review/services/mock-reviews";
import type { HelpyReview, ReviewConfirmResult } from "@/features/review/services/types";
import {
  REVIEW_CONFIRM_MESSAGE,
  REVIEW_MODAL_TITLE,
} from "@/features/review/services/types";

const confirmedReviews = new Set<string>();

export function createReviewForAction(
  vorgang: Vorgang,
  action: PreparedHelpyAction
): HelpyReview {
  return buildMockReview(vorgang, action);
}

export function confirmReview(instanceId: string): ReviewConfirmResult {
  confirmedReviews.add(instanceId);

  return {
    instanceId,
    confirmed: true,
    helpyMessage: REVIEW_CONFIRM_MESSAGE,
  };
}

export function isReviewConfirmed(instanceId: string): boolean {
  return confirmedReviews.has(instanceId);
}

export function cancelReview(_instanceId: string): void {
  // Mock — kein persistenter State nötig
}

export function getReviewModalTitle(): string {
  return REVIEW_MODAL_TITLE;
}

export function resetReviewState(): void {
  confirmedReviews.clear();
}
