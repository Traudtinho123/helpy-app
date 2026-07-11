import { detectIncomingEvents } from "@/features/brain/services/intake/intake-detector";
import {
  INTAKE_ACTIVITY_TIMELINE,
  INTAKE_PANEL_MESSAGE,
  INTAKE_PANEL_RECOMMENDATION,
  INTAKE_PANEL_TITLE,
  createInitialVorgaenge,
  getIntakeSummary,
} from "@/features/brain/services/intake/mock-intake-events";
import type {
  IntakeProcessorOptions,
  IntakeState,
  IntakeVorgang,
  IntakeVorgangStatus,
} from "@/features/brain/services/intake/types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createInitialIntakeState(): IntakeState {
  return {
    phase: "monitoring",
    visibleDetectionIds: [],
    visibleVorgangIds: [],
    detections: detectIncomingEvents(),
    vorgaenge: [],
    summary: getIntakeSummary(createInitialVorgaenge()),
    timeline: [],
    panelTitle: INTAKE_PANEL_TITLE,
    panelMessage: "Ich überwache neue Eingänge…",
    panelRecommendation: "",
    currentDetectionLabel: "",
  };
}

export async function runIntakeProcessor(
  options?: IntakeProcessorOptions
): Promise<IntakeState> {
  const detectionDelayMs = options?.detectionDelayMs ?? 400;
  const waitBeforeVorgaengeMs = options?.waitBeforeVorgaengeMs ?? 2000;
  const vorgangRevealDelayMs = options?.vorgangRevealDelayMs ?? 280;
  const detections = detectIncomingEvents();
  const vorgaenge = createInitialVorgaenge();
  const visibleDetectionIds: string[] = [];
  const visibleVorgangIds: string[] = [];
  const timeline = [...INTAKE_ACTIVITY_TIMELINE];

  const emit = (state: IntakeState) => {
    options?.onUpdate?.(state);
  };

  emit({
    phase: "detecting",
    visibleDetectionIds: [],
    visibleVorgangIds: [],
    detections,
    vorgaenge,
    summary: getIntakeSummary(vorgaenge),
    timeline: [],
    panelTitle: INTAKE_PANEL_TITLE,
    panelMessage: "Ich prüfe neue Eingänge…",
    panelRecommendation: "",
    currentDetectionLabel: "",
  });

  for (let i = 0; i < detections.length; i++) {
    visibleDetectionIds.push(detections[i].id);

    emit({
      phase: "detecting",
      visibleDetectionIds: [...visibleDetectionIds],
      visibleVorgangIds: [],
      detections,
      vorgaenge,
      summary: getIntakeSummary(vorgaenge),
      timeline: timeline.slice(0, Math.min(i + 2, timeline.length)),
      panelTitle: INTAKE_PANEL_TITLE,
      panelMessage: detections[i].label,
      panelRecommendation: "",
      currentDetectionLabel: detections[i].label,
    });

    await delay(detectionDelayMs);
  }

  emit({
    phase: "waiting",
    visibleDetectionIds: [...visibleDetectionIds],
    visibleVorgangIds: [],
    detections,
    vorgaenge,
    summary: getIntakeSummary(vorgaenge),
    timeline,
    panelTitle: INTAKE_PANEL_TITLE,
    panelMessage: "Ich bereite Vorgänge vor…",
    panelRecommendation: "",
    currentDetectionLabel: "",
  });

  await delay(waitBeforeVorgaengeMs);

  emit({
    phase: "processing",
    visibleDetectionIds: [...visibleDetectionIds],
    visibleVorgangIds: [],
    detections,
    vorgaenge,
    summary: getIntakeSummary(vorgaenge),
    timeline,
    panelTitle: INTAKE_PANEL_TITLE,
    panelMessage: "Ich bereite Vorgänge vor…",
    panelRecommendation: "",
    currentDetectionLabel: "",
  });

  for (let i = 0; i < vorgaenge.length; i++) {
    visibleVorgangIds.push(vorgaenge[i].id);
    await delay(vorgangRevealDelayMs);

    emit({
      phase: "processing",
      visibleDetectionIds: [...visibleDetectionIds],
      visibleVorgangIds: [...visibleVorgangIds],
      detections,
      vorgaenge,
      summary: getIntakeSummary(vorgaenge),
      timeline,
      panelTitle: INTAKE_PANEL_TITLE,
      panelMessage: `${visibleVorgangIds.length} Vorgänge vorbereitet…`,
      panelRecommendation: "",
      currentDetectionLabel: "",
    });
  }

  const finalState: IntakeState = {
    phase: "ready",
    visibleDetectionIds: detections.map((d) => d.id),
    visibleVorgangIds: vorgaenge.map((v) => v.id),
    detections,
    vorgaenge,
    summary: getIntakeSummary(vorgaenge),
    timeline,
    panelTitle: INTAKE_PANEL_TITLE,
    panelMessage: INTAKE_PANEL_MESSAGE,
    panelRecommendation: INTAKE_PANEL_RECOMMENDATION,
    currentDetectionLabel: "",
  };

  emit(finalState);
  return finalState;
}

export function updateVorgangStatus(
  vorgaenge: IntakeVorgang[],
  id: string,
  status: IntakeVorgangStatus
): IntakeVorgang[] {
  return vorgaenge.map((v) => (v.id === id ? { ...v, status } : v));
}
