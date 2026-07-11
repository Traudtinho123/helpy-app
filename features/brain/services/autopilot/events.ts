import {
  MOCK_INCOMING_EMAILS,
  MOCK_PREPARED_VORGAENGE,
} from "@/features/brain/services/autopilot/mock-vorgaenge";

export function getIncomingEmailCount(): number {
  return MOCK_INCOMING_EMAILS.length;
}

export function getPreparedVorgaenge() {
  return MOCK_PREPARED_VORGAENGE;
}
