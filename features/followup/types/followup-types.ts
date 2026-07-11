export type FollowUpStatus = "warten" | "erinnerung" | "dringend" | "abgeschlossen";

export type FollowUpPreparedActionKind =
  | "nachfrage_pruefen"
  | "anruf_planen"
  | "vorgang_abschliessen";

export type FollowUpPreparedAction = {
  kind: FollowUpPreparedActionKind;
  label: string;
  buttonLabel: string;
};

export type FollowUp = {
  id: string;
  vorgangId: string;
  customerId: string;
  customerName: string;
  vorgangTitel: string;
  vorgangTyp?: string;
  lastOutgoingMail: string;
  lastIncomingMail: string | null;
  daysWithoutAnswer: number;
  status: FollowUpStatus;
  recommendation: string;
  preparedAction: FollowUpPreparedAction | null;
  notifiedAt3Days: boolean;
  notifiedAt7Days: boolean;
  href: string;
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  warten: "Warten",
  erinnerung: "Erinnerung",
  dringend: "Dringend",
  abgeschlossen: "Abgeschlossen",
};

export type FollowUpTimelineEntry = {
  id: string;
  followUpId: string;
  vorgangId: string;
  at: string;
  label: string;
  detail: string;
};
