import {
  getAllMailVorgaenge,
  hasAnyMailVorgaenge,
} from "@/features/mail/unified-mail-source-service";
import {
  buildVorgaengeCentralSummary,
  getStableActiveOpenMailCasesCountSnapshot as readStableActiveOpenMailCasesCount,
  subscribeVorgaengeCounts,
  type VorgaengeCentralSummary,
} from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import type { DailyStatusSummary } from "@/features/workspace/services/status/types";
import { STATUS_PANEL_MESSAGE } from "@/features/workspace/services/status";

export type MailSummary = VorgaengeCentralSummary;

const EMPTY_DAILY_STATUS: DailyStatusSummary = {
  vorbereitet: 0,
  wartenAufPruefung: 0,
  bestaetigt: 0,
  erledigt: 0,
  introMessage: STATUS_PANEL_MESSAGE,
};

export const EMPTY_MAIL_SUMMARY: MailSummary = {
  total: 0,
  active: 0,
  erledigt: 0,
  filterCounts: {
    alle: 0,
    neu: 0,
    termine_anfragen: 0,
    in_bearbeitung: 0,
    erledigt: 0,
    wartend: 0,
    helpy_reports: 0,
    helpy_phone: 0,
    helpy_reports_unread: 0,
  },
  dailyStatus: EMPTY_DAILY_STATUS,
};

/** Gibt es Vorgänge aus verbundenen Mail-Quellen (Gmail, Outlook, …)? */
export function hasMailVorgaenge(): boolean {
  return hasAnyMailVorgaenge();
}

/** Zentrale Mail-Zusammenfassung für Dashboard, Sidebar, Arbeitstag, Vorgänge. */
export function getMailSummary(): MailSummary {
  const vorgaenge = getAllMailVorgaenge();
  if (vorgaenge.length === 0) {
    return EMPTY_MAIL_SUMMARY;
  }
  return buildVorgaengeCentralSummary(vorgaenge);
}

/** Anzahl aktiver offener Mail-Vorgänge (ohne Warten auf Antwort / Erledigt). */
export function getActiveOpenMailCasesCount(): number {
  return getMailSummary().active;
}

export function getStableActiveOpenMailCasesCountSnapshot(): number {
  if (!hasMailVorgaenge()) {
    return 0;
  }
  return readStableActiveOpenMailCasesCount();
}

export function getServerActiveOpenMailCasesCountSnapshot(): number {
  return 0;
}

export { subscribeVorgaengeCounts as subscribeMailSummary };
