export {
  HelpyAutopilot,
  PANEL_RECOMMENDATION,
  PANEL_SUMMARY_MESSAGE,
  createAutopilotIdleState,
  helpyAutopilot,
  markVorgangErledigt,
  markVorgangGeoeffnet,
  runAutopilotPipeline,
} from "@/features/brain/services/autopilot/autopilot";

export {
  getIncomingEmailCount,
  getPreparedVorgaenge,
} from "@/features/brain/services/autopilot/events";

export {
  AUTOPILOT_EMAIL_COUNT,
  AUTOPILOT_RELEVANT_COUNT,
  MOCK_INCOMING_EMAILS,
  MOCK_PREPARED_VORGAENGE,
  createInitialVorgaenge,
  getVorgangSummary,
} from "@/features/brain/services/autopilot/mock-vorgaenge";

export type { AutopilotEvent, AutopilotEventType } from "@/features/brain/services/autopilot/mock-events";

export {
  AutopilotEventQueue,
  globalAutopilotQueue,
} from "@/features/brain/services/autopilot/queue";

export type {
  ActivityTimelineEntry,
  AutopilotEmail,
  AutopilotFeedback,
  AutopilotRunOptions,
  AutopilotRunState,
  AutopilotRunStatus,
  PreparedVorgang,
  VorgangActionType,
  VorgangPrioritaet,
  VorgangStatus,
  VorgangSummary,
  VorgangTyp,
} from "@/features/brain/services/autopilot/types";

export type { QueuedAutopilotEvent } from "@/features/brain/services/autopilot/queue";
