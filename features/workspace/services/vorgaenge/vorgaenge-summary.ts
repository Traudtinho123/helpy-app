import { getDailyStatusSummary, subscribeStatus } from "@/features/workspace/services/status";
import type { DailyStatusSummary } from "@/features/workspace/services/status/types";
import { subscribeCompletedVorgaenge } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import {
  countUnreadHelpyReports,
  subscribeHelpyReportReads,
} from "@/features/workspace/services/vorgaenge/helpy-report-read-store";
import {
  getEffectiveVorgangStatus,
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
  isVorgangErledigt,
} from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import { deduplicateVorgaenge } from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import {
  getAllMailVorgaenge,
  subscribeAllMailVorgaenge,
} from "@/features/mail/unified-mail-source-service";
import { subscribeOutlookConnection } from "@/features/outlook/services/outlook-auth-service";
import {
  getGmailVorgaenge,
  subscribeGmailVorgaenge,
} from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import type { Vorgang, VorgangFilter } from "@/features/workspace/services/vorgaenge/types";

export type VorgaengeFilterCounts = Record<VorgangFilter, number> & {
  helpy_reports_unread: number;
};

export type VorgaengeCentralSummary = {
  total: number;
  active: number;
  erledigt: number;
  filterCounts: VorgaengeFilterCounts;
  dailyStatus: DailyStatusSummary;
};

function buildFilterCounts(vorgaenge: Vorgang[]): VorgaengeFilterCounts {
  const customerVorgaenge = vorgaenge.filter((item) => !isHelpyReportVorgang(item));
  const activeOpen = customerVorgaenge.filter((item) => isVorgangActiveOpen(item));
  const helpyReports = vorgaenge.filter((item) => isHelpyReportVorgang(item));

  return {
    alle: activeOpen.length,
    neu: customerVorgaenge.filter((item) => getEffectiveVorgangStatus(item) === "neu")
      .length,
    in_bearbeitung: customerVorgaenge.filter(
      (item) => getEffectiveVorgangStatus(item) === "in_bearbeitung"
    ).length,
    erledigt: customerVorgaenge.filter((item) => isVorgangErledigt(item)).length,
    wartend: customerVorgaenge.filter((item) => isVorgangAwaitingCustomerReply(item))
      .length,
    helpy_reports: helpyReports.length,
    helpy_reports_unread: countUnreadHelpyReports(
      helpyReports.map((item) => item.id)
    ),
  };
}

/** Zentrale Count-/Summary-Funktion — eine Quelle für Sidebar, Vorgänge, Arbeitstag. */
export function buildVorgaengeCentralSummary(
  vorgaenge: Vorgang[]
): VorgaengeCentralSummary {
  const { vorgaenge: unique } = deduplicateVorgaenge(vorgaenge);
  const customerVorgaenge = unique.filter((item) => !isHelpyReportVorgang(item));
  const active = customerVorgaenge.filter((item) => isVorgangActiveOpen(item));
  const erledigt = customerVorgaenge.filter((item) => isVorgangErledigt(item));

  return {
    total: customerVorgaenge.length,
    active: active.length,
    erledigt: erledigt.length,
    filterCounts: buildFilterCounts(unique),
    dailyStatus: getDailyStatusSummary(customerVorgaenge),
  };
}

export function getActiveOpenMailCasesCount(): number {
  return buildVorgaengeCentralSummary(getAllMailVorgaenge()).active;
}

type ActiveCountCache = {
  fingerprint: string;
  value: number;
};

let activeCountCache: ActiveCountCache | null = null;

function buildActiveCountFingerprint(count: number, vorgaenge: Vorgang[]): string {
  const parts = vorgaenge
    .slice(0, 12)
    .map(
      (item) =>
        `${item.id}:${item.status}:${getEffectiveVorgangStatus(item)}`
    );
  return `${count}|${parts.join(",")}|${vorgaenge.length}`;
}

export function getStableActiveOpenMailCasesCountSnapshot(): number {
  const vorgaenge = getAllMailVorgaenge();
  const count = buildVorgaengeCentralSummary(vorgaenge).active;
  const fingerprint = buildActiveCountFingerprint(count, vorgaenge);

  if (activeCountCache?.fingerprint === fingerprint) {
    return activeCountCache.value;
  }

  activeCountCache = { fingerprint, value: count };
  return count;
}

export function getServerActiveOpenMailCasesCountSnapshot(): number {
  return 0;
}

/** @deprecated Nutze getActiveOpenMailCasesCount */
export const getActiveGmailVorgaengeCount = getActiveOpenMailCasesCount;

/** @deprecated Nutze getStableActiveOpenMailCasesCountSnapshot */
export const getStableActiveGmailVorgaengeCountSnapshot =
  getStableActiveOpenMailCasesCountSnapshot;

/** @deprecated Nutze getServerActiveOpenMailCasesCountSnapshot */
export const getServerActiveGmailVorgaengeCountSnapshot =
  getServerActiveOpenMailCasesCountSnapshot;

export function invalidateVorgaengeSummaryCaches(): void {
  activeCountCache = null;
}

/** Kombiniert Gmail-, Status- und Erledigt-Store für Count-Updates. */
export function subscribeVorgaengeCounts(listener: () => void): () => void {
  const unsubs = [
    subscribeGmailVorgaenge(listener),
    subscribeAllMailVorgaenge(listener),
    subscribeOutlookConnection(listener),
    subscribeStatus(listener),
    subscribeCompletedVorgaenge(listener),
    subscribeHelpyReportReads(listener),
  ];
  return () => unsubs.forEach((unsub) => unsub());
}

export function getMailCentralSummary(): VorgaengeCentralSummary {
  return buildVorgaengeCentralSummary(getAllMailVorgaenge());
}

/** @deprecated Nutze getMailCentralSummary */
export const getVorgaengeCentralSummaryFromGmail = getMailCentralSummary;
