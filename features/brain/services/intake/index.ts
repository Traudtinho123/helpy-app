export {
  detectIncomingEvents,
  getDetectionLabel,
  mapEventsToVorgaenge,
} from "@/features/brain/services/intake/intake-detector";

export {
  createInitialIntakeState,
  runIntakeProcessor,
  updateVorgangStatus,
} from "@/features/brain/services/intake/intake-processor";

export {
  INTAKE_ACTIVITY_TIMELINE,
  INTAKE_FEEDBACK_MESSAGE,
  INTAKE_PANEL_MESSAGE,
  INTAKE_PANEL_RECOMMENDATION,
  INTAKE_PANEL_TITLE,
  MOCK_INTAKE_DETECTIONS,
  MOCK_INTAKE_VORGAENGE,
  createInitialVorgaenge,
  getIntakeSummary,
} from "@/features/brain/services/intake/mock-intake-events";

export type {
  IntakeEvent,
  IntakeEventType,
  IntakeFeedback,
  IntakePhase,
  IntakeProcessorOptions,
  IntakeState,
  IntakeSummary,
  IntakeTimelineEntry,
  IntakeVorgang,
  IntakeVorgangActionType,
  IntakeVorgangPrioritaet,
  IntakeVorgangStatus,
  IntakeVorgangTyp,
} from "@/features/brain/services/intake/types";
