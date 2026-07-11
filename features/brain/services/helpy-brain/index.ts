export {
  analyzeEmail,
  analyzeEmailSync,
  DEMO_BRAIN_EMAIL,
  generateDailyPlan,
  generateDailyPlanSync,
  helpyBrain,
  HelpyBrain,
  processConnectEventQueueForBrain,
  processConnectEventsWithBrainV2,
  type AnalyzeEmailOptions,
} from "@/features/brain/services/helpy-brain/brain";

export { createDailyPlan } from "@/features/brain/services/helpy-brain/daily-planner";
export {
  MOCK_WORKDAY_ITEMS,
  MOCK_WORKDAY_STATUS,
  MOCK_WORKDAY_USER_NAME,
} from "@/features/brain/services/helpy-brain/mock-workday";
export {
  prioritizeWorkdayItems,
  toPrioritizedItems,
} from "@/features/brain/services/helpy-brain/priority-engine";

export { analyzeEmailContent } from "@/features/brain/services/helpy-brain/email-analyzer";
export { detectCalendarEvents } from "@/features/brain/services/helpy-brain/calendar-detector";
export { detectOffers } from "@/features/brain/services/helpy-brain/offer-detector";
export { detectTasks } from "@/features/brain/services/helpy-brain/task-detector";

export type {
  BrainEmailInput,
  BrainPrioritaet,
  CalendarDetectionResult,
  DailyPlan,
  DailyPlanStatusMetric,
  EmailAnalysisResult,
  EmailAnalyzerContext,
  ErkannteAufgabe,
  ErkannteTermin,
  ErkanntesAngebot,
  GenerateDailyPlanOptions,
  Kundentyp,
  OfferDetectionResult,
  PrioritizedWorkdayItem,
  PriorityScoreBreakdown,
  TaskDetectionResult,
  WorkdayInputItem,
  WorkdayItemCategory,
} from "@/features/brain/services/helpy-brain/types";
