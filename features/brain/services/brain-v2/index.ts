export {
  buildBrainSummary,
  getBrainV2Items,
  getBrainV2Summary,
  getWorkItemEmoji,
  processConnectEvent,
  processConnectEvents,
  processHelpyEvent,
  processHelpyEvents,
  resetBrainV2Cache,
  runBrainV2,
} from "@/features/brain/services/brain-v2/brain-engine";

export { buildContext, buildSummary } from "@/features/brain/services/brain-v2/context-builder";
export { matchCustomer } from "@/features/brain/services/brain-v2/customer-matcher";
export { detectIntent, getIntentEmoji } from "@/features/brain/services/brain-v2/intent-detector";
export {
  detectPriority,
  PRIORITY_SORT_ORDER,
  sortByBrainPriority,
} from "@/features/brain/services/brain-v2/priority-detector";
export { createRecommendation } from "@/features/brain/services/brain-v2/recommendation-engine";

export {
  formatReceivedLabel,
  getMockEnrichment,
  INTENT_SKILL_HINTS,
  MOCK_BRAIN_ENRICHMENTS,
  resolvePlatformName,
} from "@/features/brain/services/brain-v2/mock-brain-results";

export {
  BRAIN_INTENT_LABELS,
  BRAIN_PRIORITY_LABELS,
  BRAIN_V2_PANEL,
  CUSTOMER_MATCH_LABELS,
} from "@/features/brain/services/brain-v2/types";

export type {
  BrainIntent,
  BrainPriority,
  BrainV2Result,
  BrainV2Summary,
  ContextBuildInput,
  CreatedObject,
  CustomerMatch,
  CustomerMatchType,
  IntentDetectionInput,
  PreparedAction,
  PreparedWorkItem,
  PreparedWorkItemStatus,
  PriorityDetectionInput,
  RecommendationInput,
} from "@/features/brain/services/brain-v2/types";
