export type {
  WorkdayDataSource,
  WorkdaySummary,
} from "@/features/workday/services/workday-summary";

export {
  WORKDAY_METRIC_PLACEHOLDERS,
  buildDailyPlanFromWorkdaySummary,
  buildEmptyWorkdaySummary,
  buildWorkdaySummary,
  isCriticalOrHighPriorityItem,
  sortWorkdayVorgaenge,
} from "@/features/workday/services/workday-summary";

export {
  WORKDAY_GREETING_PLACEHOLDER,
  buildWorkdayGreeting,
  extractFirstNameFromUser,
  resolveWorkdayGreetingFromUser,
} from "@/features/workday/services/workday-greeting";

export { PreparedMailVorgaengeSection } from "@/features/workday/components/prepared-gmail-vorgaenge-section";
/** @deprecated Nutze PreparedMailVorgaengeSection */
export { PreparedMailVorgaengeSection as PreparedGmailVorgaengeSection } from "@/features/workday/components/prepared-gmail-vorgaenge-section";
