import {
  MOCK_INTAKE_DETECTIONS,
  MOCK_INTAKE_VORGAENGE,
} from "@/features/brain/services/intake/mock-intake-events";
import type { IntakeEvent, IntakeVorgang } from "@/features/brain/services/intake/types";

export function detectIncomingEvents(): IntakeEvent[] {
  return MOCK_INTAKE_DETECTIONS;
}

export function mapEventsToVorgaenge(events: IntakeEvent[]): IntakeVorgang[] {
  const eventIds = new Set(events.map((e) => e.id));
  return MOCK_INTAKE_VORGAENGE.filter((v) => eventIds.has(v.intakeEventId));
}

export function getDetectionLabel(event: IntakeEvent): string {
  return event.label;
}
