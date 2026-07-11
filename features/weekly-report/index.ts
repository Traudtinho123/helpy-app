export type {
  WeeklyReportData,
  WeeklyReportMetric,
  WeeklyReportRecommendation,
  WeeklyReportStaleItem,
  WeeklyReportTrend,
} from "@/features/weekly-report/types/weekly-report-types";

export { buildWeeklyReport } from "@/features/weekly-report/services/weekly-report-builder";
export {
  dispatchWeeklyReports,
  fetchWeeklyReportRecipients,
} from "@/features/weekly-report/services/weekly-report-dispatch";
export {
  buildWeeklyReportHtml,
  buildWeeklyReportSubject,
  buildWeeklyReportText,
} from "@/features/weekly-report/services/weekly-report-html";
export {
  isWeeklyReportMailConfigured,
  sendWeeklyReportEmail,
} from "@/features/weekly-report/services/weekly-report-sender";
