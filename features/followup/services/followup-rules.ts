import type {
  FollowUpPreparedAction,
  FollowUpStatus,
} from "@/features/followup/types/followup-types";

export const FOLLOWUP_DAY_THRESHOLDS = {
  erinnerung: 3,
  dringend: 7,
  abschluss: 14,
} as const;

export function computeDaysWithoutAnswer(
  lastOutgoingMail: string,
  now = new Date()
): number {
  const sentAt = new Date(lastOutgoingMail);
  if (Number.isNaN(sentAt.getTime())) return 0;

  const diffMs = now.getTime() - sentAt.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

export function deriveFollowUpStatus(
  daysWithoutAnswer: number,
  currentStatus: FollowUpStatus
): FollowUpStatus {
  if (currentStatus === "abgeschlossen") return "abgeschlossen";

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.dringend) {
    return "dringend";
  }

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.erinnerung) {
    return "erinnerung";
  }

  return "warten";
}

export function deriveFollowUpRecommendation(
  status: FollowUpStatus,
  daysWithoutAnswer: number
): string {
  if (status === "abgeschlossen") {
    return "Dieser Follow-up ist abgeschlossen.";
  }

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.abschluss) {
    return "Keine Rückmeldung erhalten.";
  }

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.dringend) {
    return "Ich empfehle einen kurzen Anruf.";
  }

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.erinnerung) {
    return `Der Kunde hat seit ${daysWithoutAnswer} Tagen nicht geantwortet.`;
  }

  return "Warten auf Antwort.";
}

export function deriveFollowUpPreparedAction(
  status: FollowUpStatus,
  daysWithoutAnswer: number
): FollowUpPreparedAction | null {
  if (status === "abgeschlossen") return null;

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.abschluss) {
    return {
      kind: "vorgang_abschliessen",
      label: "Vorgang abschließen vorbereiten",
      buttonLabel: "Vorgang abschließen",
    };
  }

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.dringend) {
    return {
      kind: "anruf_planen",
      label: "Kurzen Anruf vorbereiten",
      buttonLabel: "Anruf planen",
    };
  }

  if (daysWithoutAnswer >= FOLLOWUP_DAY_THRESHOLDS.erinnerung) {
    return {
      kind: "nachfrage_pruefen",
      label: "Freundliche Nachfrage vorbereiten",
      buttonLabel: "Nachfrage prüfen",
    };
  }

  return null;
}

export function isAngebotsFollowUp(vorgangTyp?: string): boolean {
  if (!vorgangTyp) return false;
  const haystack = vorgangTyp.toLowerCase();
  return haystack.includes("angebot") || haystack.includes("offert");
}
