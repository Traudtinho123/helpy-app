import { findCompletedRecord } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { resolveVorgangInquiryReceivedAt } from "@/features/mail/services/mail-received-at";
import {
  getVorgangStatusSnapshot,
} from "@/features/workspace/services/status/status-engine";
import type { HelpyVorgangStatus } from "@/features/workspace/services/status/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import {
  RESPONSE_TIMER_HINTS,
  RESPONSE_TIMER_STALE_ALERT_MS,
  RESPONSE_TIMER_THRESHOLDS_MS,
} from "@/features/workspace/services/response-timer/response-timer-config";

export type ResponseTimerUrgency =
  | "fresh"
  | "yellow"
  | "orange"
  | "red"
  | "completed";

export type ResponseTimerState = {
  urgency: ResponseTimerUrgency;
  elapsedMs: number;
  primaryLabel: string;
  hint?: string;
  compactLabel: string;
  responseTimeMs?: number;
  responseTimeLabel?: string;
  isWaiting: boolean;
};

export type ResponseTimerInput = {
  receivedAt: string;
  completedAt?: string | null;
  isCompleted: boolean;
  now?: number;
};

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getElapsedMs(
  receivedAt: string,
  now: number = Date.now()
): number {
  const start = parseTimestamp(receivedAt);
  if (start === null) return 0;
  return Math.max(0, now - start);
}

export function formatGermanDurationParts(ms: number): {
  primary: string;
  compact: string;
} {
  if (ms < MS_MINUTE) {
    return { primary: "weniger als 1 Minute", compact: "<1m" };
  }

  if (ms < MS_HOUR) {
    const minutes = Math.max(1, Math.floor(ms / MS_MINUTE));
    return {
      primary: `${minutes} Minute${minutes === 1 ? "" : "n"}`,
      compact: `${minutes}m`,
    };
  }

  if (ms < MS_DAY) {
    const hours = Math.max(1, Math.floor(ms / MS_HOUR));
    return {
      primary: `${hours} Stunde${hours === 1 ? "" : "n"}`,
      compact: `${hours}h`,
    };
  }

  const days = Math.max(1, Math.floor(ms / MS_DAY));
  return {
    primary: `${days} Tag${days === 1 ? "" : "en"}`,
    compact: `${days}T`,
  };
}

export function formatGermanResponseTime(ms: number): string {
  if (ms < MS_MINUTE) {
    return "weniger als 1 Minute";
  }

  const hours = Math.floor(ms / MS_HOUR);
  const minutes = Math.floor((ms % MS_HOUR) / MS_MINUTE);

  if (hours <= 0) {
    return `${Math.max(1, minutes)} Minute${minutes === 1 ? "" : "n"}`;
  }

  if (minutes <= 0) {
    return `${hours} Stunde${hours === 1 ? "" : "n"}`;
  }

  return `${hours} Stunde${hours === 1 ? "" : "n"} ${minutes} Minute${minutes === 1 ? "" : "n"}`;
}

function resolveWaitingUrgency(elapsedMs: number): ResponseTimerUrgency {
  if (elapsedMs < RESPONSE_TIMER_THRESHOLDS_MS.yellow) return "fresh";
  if (elapsedMs < RESPONSE_TIMER_THRESHOLDS_MS.orange) return "yellow";
  if (elapsedMs < RESPONSE_TIMER_THRESHOLDS_MS.red) return "orange";
  return "red";
}

export type HelpyPanelWaitHint = {
  primaryLine: string;
  secondaryLine?: string;
  textClassName: string;
};

export function computeHelpyPanelWaitHint(
  input: ResponseTimerInput
): HelpyPanelWaitHint | null {
  const now = input.now ?? Date.now();
  if (input.isCompleted) return null;

  const receivedAtMs = parseTimestamp(input.receivedAt);
  if (receivedAtMs === null) return null;

  const elapsedMs = Math.max(0, now - receivedAtMs);
  const duration = formatGermanDurationParts(elapsedMs);
  const primaryLine = `Diese Anfrage ist vor ${duration.primary} eingegangen.`;

  if (elapsedMs < RESPONSE_TIMER_THRESHOLDS_MS.yellow) {
    return {
      primaryLine,
      textClassName: "text-[#64748B]",
    };
  }

  if (elapsedMs < RESPONSE_TIMER_THRESHOLDS_MS.orange) {
    return {
      primaryLine,
      textClassName: "text-[#B45309]",
    };
  }

  if (elapsedMs < RESPONSE_TIMER_THRESHOLDS_MS.red) {
    return {
      primaryLine,
      textClassName: "text-[#DC2626]",
    };
  }

  return {
    primaryLine,
    secondaryLine: "Schnelle Antwort wird empfohlen.",
    textClassName: "text-[#DC2626]",
  };
}

export function computeResponseTimerState(
  input: ResponseTimerInput
): ResponseTimerState | null {
  const now = input.now ?? Date.now();
  const receivedAtMs = parseTimestamp(input.receivedAt);
  if (receivedAtMs === null) return null;

  if (input.isCompleted) {
    const completedAtMs =
      parseTimestamp(input.completedAt) ?? now;
    const responseTimeMs = Math.max(0, completedAtMs - receivedAtMs);
    const responseTimeLabel = formatGermanResponseTime(responseTimeMs);

    return {
      urgency: "completed",
      elapsedMs: responseTimeMs,
      primaryLabel: `Beantwortet in ${responseTimeLabel}`,
      compactLabel: formatGermanDurationParts(responseTimeMs).compact,
      responseTimeMs,
      responseTimeLabel,
      isWaiting: false,
    };
  }

  const elapsedMs = Math.max(0, now - receivedAtMs);
  const urgency = resolveWaitingUrgency(elapsedMs);
  const duration = formatGermanDurationParts(elapsedMs);

  let primaryLabel = `Vor ${duration.primary} eingegangen`;

  const hint =
    urgency === "yellow"
      ? RESPONSE_TIMER_HINTS.yellow
      : urgency === "orange"
        ? RESPONSE_TIMER_HINTS.orange
        : urgency === "red"
          ? RESPONSE_TIMER_HINTS.red
          : undefined;

  return {
    urgency,
    elapsedMs,
    primaryLabel,
    hint,
    compactLabel: duration.compact,
    isWaiting: true,
  };
}

export function isVorgangResponseCompleted(
  vorgang: Vorgang,
  currentStatus?: HelpyVorgangStatus
): boolean {
  const status =
    currentStatus ?? getVorgangStatusSnapshot(vorgang).currentStatus;
  return status === "erledigt" || vorgang.status === "erledigt";
}

export function resolveVorgangResponseTimerInput(
  vorgang: Vorgang,
  options?: { currentStatus?: HelpyVorgangStatus; now?: number }
): ResponseTimerInput | null {
  if (isHelpyReportVorgang(vorgang)) return null;

  const receivedAt = resolveVorgangInquiryReceivedAt(vorgang);
  if (!receivedAt) return null;

  const isCompleted = isVorgangResponseCompleted(
    vorgang,
    options?.currentStatus
  );
  const completedRecord = isCompleted ? findCompletedRecord(vorgang) : undefined;

  return {
    receivedAt,
    completedAt: completedRecord?.completedAt ?? null,
    isCompleted,
    now: options?.now,
  };
}

export function getVorgangResponseTimerState(
  vorgang: Vorgang,
  options?: { currentStatus?: HelpyVorgangStatus; now?: number }
): ResponseTimerState | null {
  const input = resolveVorgangResponseTimerInput(vorgang, options);
  if (!input) return null;
  return computeResponseTimerState(input);
}

export function isVorgangStaleForResponse(
  vorgang: Vorgang,
  now: number = Date.now()
): boolean {
  if (isHelpyReportVorgang(vorgang)) return false;
  if (isVorgangResponseCompleted(vorgang)) return false;

  const receivedAt = resolveVorgangInquiryReceivedAt(vorgang);
  if (!receivedAt) return false;

  const elapsed = getElapsedMs(receivedAt, now);
  return elapsed >= RESPONSE_TIMER_STALE_ALERT_MS;
}

export function countStaleVorgaenge(
  vorgaenge: readonly Vorgang[],
  now: number = Date.now()
): number {
  return vorgaenge.filter((vorgang) => isVorgangStaleForResponse(vorgang, now))
    .length;
}

export function getStaleVorgaenge(
  vorgaenge: readonly Vorgang[],
  now: number = Date.now()
): Vorgang[] {
  return vorgaenge.filter((vorgang) => isVorgangStaleForResponse(vorgang, now));
}

export const RESPONSE_TIMER_DOT_COLORS: Record<ResponseTimerUrgency, string> = {
  fresh: "bg-[#34D399]",
  yellow: "bg-[#FBBF24]",
  orange: "bg-[#FB923C]",
  red: "bg-[#F87171]",
  completed: "bg-[#94A3B8]",
};

export const RESPONSE_TIMER_TEXT_COLORS: Record<ResponseTimerUrgency, string> = {
  fresh: "text-[#047857]",
  yellow: "text-[#B45309]",
  orange: "text-[#C2410C]",
  red: "text-[#B91C1C]",
  completed: "text-[#64748B]",
};
