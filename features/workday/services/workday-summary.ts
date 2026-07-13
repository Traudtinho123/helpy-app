import type { DailyPlan, DailyPlanStatusMetric, PrioritizedWorkdayItem } from "@/features/brain/services/helpy-brain/types";
import { createDailyPlan } from "@/features/brain/services/helpy-brain/daily-planner";
import { buildWorkdayGreeting } from "@/features/workday/services/workday-greeting";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import {
  deduplicateVorgaenge,
  sortDeduplicatedVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import { isVorgangActiveOpen } from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { readPlatformContextValue } from "@/features/brain/services/platform-inquiry-context";
import {
  formatParsedTime,
  parseGermanTime,
} from "@/features/appointment-suggestions/services/viewing-time-parser";
import {
  VORGANG_PRIORITY_LABELS,
  type Vorgang,
} from "@/features/workspace/services/vorgaenge/types";
import { getWorkspacePath } from "@/features/workspace/services/workspace";

export type WorkdayDataSource = "gmail" | "mock" | "empty";

export type WorkdayTerminItem = {
  id: string;
  titel: string;
  kunde: string;
  uhrzeit: string | null;
  endUhrzeit?: string | null;
  ort?: string | null;
  quelle: "Gmail" | "Kalender" | "Google Kalender" | "Apple Kalender";
  href: string;
};

export type WorkdaySummary = {
  source: WorkdayDataSource;
  emailsProcessed: number;
  vorgaengePrepared: number;
  criticalCount: number;
  highPriorityCount: number;
  preparedReplies: number;
  archivePrepared: number;
  newCustomers: number;
  preparedOffers: number;
  appointmentRequests: number;
  sortedVorgaenge: Vorgang[];
  todayAppointments: WorkdayTerminItem[];
  statusMetrics: DailyPlanStatusMetric[];
  summaryText: string;
  panelIntro: string;
  panelPriorityHint: string;
  panelArchiveHint: string | null;
  emptyHint: string | null;
};

const WORKDAY_PANEL_INTRO =
  "Ich habe deinen Arbeitstag strukturiert. Starte am besten mit den Prioritäten und prüfe danach deine Termine.";

const EMPTY_HINT = "Noch keine echten Eingänge verarbeitet.";

function matchesIntent(
  vorgang: Vorgang,
  keys: string[]
): boolean {
  const haystack = [vorgang.intent, vorgang.intentLabel, vorgang.typ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keys.some((key) => haystack.includes(key.toLowerCase()));
}

export function sortWorkdayVorgaenge(vorgaenge: Vorgang[]): Vorgang[] {
  const serviceItems = vorgaenge.filter((item) => !shouldPrepareArchive(item));
  const archiveItems = vorgaenge.filter((item) => shouldPrepareArchive(item));

  return [
    ...sortDeduplicatedVorgaenge(serviceItems),
    ...sortDeduplicatedVorgaenge(archiveItems),
  ];
}

function countPreparedReplies(vorgaenge: Vorgang[]): number {
  return vorgaenge.filter(
    (item) => !shouldPrepareArchive(item) && Boolean(getReplyDraft(item.id))
  ).length;
}

function countNewCustomers(vorgaenge: Vorgang[]): number {
  return vorgaenge.filter(
    (item) =>
      !shouldPrepareArchive(item) &&
      (item.typ === "anfrage" ||
        matchesIntent(item, [
          "neue anfrage",
          "neuer_kunde",
          "neuer kunde",
          "interessent",
          "immobilien",
          "immobilienanfrage",
        ]))
  ).length;
}

function countPreparedOffers(vorgaenge: Vorgang[]): number {
  return vorgaenge.filter(
    (item) =>
      !shouldPrepareArchive(item) &&
      matchesIntent(item, ["offert", "angebot", "angebotsanfrage"])
  ).length;
}

function hasBesichtigungErkannt(vorgang: Vorgang): boolean {
  const besichtigung = readPlatformContextValue(
    vorgang.detectedContext,
    "Besichtigung"
  );

  if (besichtigung) {
    return true;
  }

  return matchesIntent(vorgang, ["termin", "besichtigung", "terminwunsch"]);
}

function countAppointments(vorgaenge: Vorgang[]): number {
  return vorgaenge.filter(
    (item) => !shouldPrepareArchive(item) && hasBesichtigungErkannt(item)
  ).length;
}

function buildStatusMetrics(summary: Omit<WorkdaySummary, "statusMetrics">): DailyPlanStatusMetric[] {
  return [
    { label: "E-Mails verarbeitet", value: summary.emailsProcessed },
    { label: "Vorgänge vorbereitet", value: summary.vorgaengePrepared },
    {
      label: "Hohe Priorität",
      value: summary.highPriorityCount + summary.criticalCount,
    },
    { label: "Antworten vorbereitet", value: summary.preparedReplies },
    { label: "Zum Archivieren vorbereitet", value: summary.archivePrepared },
    {
      label: "Termine / Besichtigungen erkannt",
      value: summary.appointmentRequests,
    },
  ];
}

function buildSummaryText(emailCount: number, vorgangCount: number): string {
  if (vorgangCount === 0) return EMPTY_HINT;
  if (emailCount === 1 && vorgangCount === 1) {
    return "Ich habe 1 Gmail-Nachricht geprüft und daraus einen vorbereiteten Vorgang erstellt.";
  }
  if (emailCount === vorgangCount) {
    return `Ich habe ${emailCount} Gmail-Nachrichten geprüft und daraus ${vorgangCount} vorbereitete Vorgänge erstellt.`;
  }
  return `Ich habe ${emailCount} Gmail-Nachrichten geprüft und daraus ${vorgangCount} vorbereitete Vorgänge zusammengeführt.`;
}

function buildPanelIntro(_count: number): string {
  return WORKDAY_PANEL_INTRO;
}

function buildPanelPriorityHint(critical: number, high: number): string {
  if (critical > 0 && high > 0) {
    return "Ich empfehle, zuerst die Vorgänge mit kritischer und hoher Priorität zu prüfen.";
  }
  if (critical > 0 || high > 0) {
    return "Ich empfehle, zuerst die Vorgänge mit hoher Priorität zu prüfen.";
  }
  return "Ich empfehle, die vorbereiteten Vorgänge der Reihe nach zu prüfen.";
}

function buildPanelArchiveHint(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) {
    return "Ich habe 1 Nachricht zum Archivieren vorbereitet.";
  }
  return `Ich habe ${count} Nachrichten zum Archivieren vorbereitet.`;
}

function extractTimeFromVorgang(vorgang: Vorgang): string | null {
  const besichtigung = readPlatformContextValue(
    vorgang.detectedContext,
    "Besichtigung"
  );
  if (besichtigung) {
    const parsed = parseGermanTime(besichtigung);
    if (parsed) return formatParsedTime(parsed);
  }

  const haystack = [
    besichtigung,
    vorgang.summary,
    vorgang.snippet,
    vorgang.receivedLabel,
  ]
    .filter(Boolean)
    .join(" ");

  const parsed = parseGermanTime(haystack);
  if (parsed) return formatParsedTime(parsed);

  const timeMatch = haystack.match(/\b(\d{1,2}[:.]\d{2})\s*(?:Uhr)?\b/i);
  if (timeMatch?.[1]) {
    return timeMatch[1].replace(".", ":");
  }

  return null;
}

function resolveWorkdayTerminQuelle(
  quelle: string
): WorkdayTerminItem["quelle"] {
  if (quelle === "Gmail") return "Gmail";
  if (isPlatformRealEstateQuelle(quelle)) return "Gmail";
  return "Kalender";
}

function buildTodayAppointments(_vorgaenge: Vorgang[]): WorkdayTerminItem[] {
  return [];
}

function getPriorityVorgaenge(vorgaenge: Vorgang[]): Vorgang[] {
  const serviceItems = vorgaenge.filter((item) => !shouldPrepareArchive(item));
  return sortDeduplicatedVorgaenge(serviceItems).filter(
    (item) => item.prioritaet === "kritisch" || item.prioritaet === "hoch"
  );
}

export function isCriticalOrHighPriorityItem(
  item: Pick<PrioritizedWorkdayItem, "prioritaet" | "prioritaetLabel">
): boolean {
  if (item.prioritaet === "kritisch" || item.prioritaet === "hoch") {
    return true;
  }

  const label = item.prioritaetLabel?.toLowerCase();
  return label === "kritisch" || label === "hoch";
}

function mapVorgangToPriorityItem(
  vorgang: Vorgang,
  rang: number
): PrioritizedWorkdayItem {
  const kategorie = matchesIntent(vorgang, ["offert", "angebot"])
    ? "angebot"
    : vorgang.typ === "anfrage" ||
        matchesIntent(vorgang, ["termin", "besichtigung"])
      ? "termin"
      : matchesIntent(vorgang, ["neue anfrage", "neuer", "interessent"])
        ? "kunde"
        : "email";

  const kategorieLabels: Record<PrioritizedWorkdayItem["kategorie"], string> = {
    angebot: "Angebot",
    email: "E-Mail",
    termin: "Termin",
    aufgabe: "Aufgabe",
    behoerde: "Behörde",
    kunde: "Kunde",
  };

  const dringlichkeit =
    vorgang.prioritaet === "kritisch" || vorgang.prioritaet === "hoch"
      ? "hoch"
      : vorgang.prioritaet === "niedrig"
        ? "niedrig"
        : "mittel";

  return {
    id: vorgang.id,
    titel: vorgang.titel,
    kategorie,
    kategorieLabel: vorgang.intentLabel ?? kategorieLabels[kategorie],
    deadline: vorgang.receivedLabel,
    deadlineDringlichkeit:
      vorgang.prioritaet === "kritisch"
        ? 95
        : vorgang.prioritaet === "hoch"
          ? 80
          : vorgang.prioritaet === "mittel"
            ? 55
            : 30,
    dringlichkeit,
    kundentyp: "interessent",
    wartezeitTage: 0,
    empfohleneAktion: vorgang.helpyEmpfehlung,
    priorisierungsGrund: vorgang.summary ?? vorgang.helpyEmpfehlung,
    href: getWorkspacePath(vorgang.id),
    absender: vorgang.kunde,
    prioritaet: vorgang.prioritaet,
    prioritaetLabel: VORGANG_PRIORITY_LABELS[vorgang.prioritaet],
    rang,
  };
}

/** Berechnet Kennzahlen und Texte aus echten Gmail-Vorgängen. */
export function buildWorkdaySummary(vorgaenge: Vorgang[]): WorkdaySummary {
  const { vorgaenge: uniqueVorgaenge, stats } = deduplicateVorgaenge(vorgaenge);
  const activeVorgaenge = uniqueVorgaenge.filter((item) => isVorgangActiveOpen(item));
  const sortedVorgaenge = sortWorkdayVorgaenge(activeVorgaenge);
  const serviceItems = sortedVorgaenge.filter((item) => !shouldPrepareArchive(item));

  const criticalCount = serviceItems.filter(
    (item) => item.prioritaet === "kritisch"
  ).length;
  const highPriorityCount = serviceItems.filter(
    (item) => item.prioritaet === "hoch"
  ).length;
  const archivePrepared = sortedVorgaenge.filter((item) =>
    shouldPrepareArchive(item)
  ).length;
  const preparedReplies = countPreparedReplies(sortedVorgaenge);
  const newCustomers = countNewCustomers(sortedVorgaenge);
  const preparedOffers = countPreparedOffers(sortedVorgaenge);
  const appointmentRequests = countAppointments(sortedVorgaenge);

  const base = {
    source: "gmail" as const,
    emailsProcessed: stats.workspaceCount,
    vorgaengePrepared: activeVorgaenge.length,
    criticalCount,
    highPriorityCount,
    preparedReplies,
    archivePrepared,
    newCustomers,
    preparedOffers,
    appointmentRequests,
    sortedVorgaenge,
    todayAppointments: buildTodayAppointments(sortedVorgaenge),
    summaryText: buildSummaryText(stats.workspaceCount, stats.afterMergeCount),
    panelIntro: buildPanelIntro(stats.afterMergeCount),
    panelPriorityHint: buildPanelPriorityHint(criticalCount, highPriorityCount),
    panelArchiveHint: buildPanelArchiveHint(archivePrepared),
    emptyHint: activeVorgaenge.length === 0 ? EMPTY_HINT : null,
  };

  return {
    ...base,
    statusMetrics: buildStatusMetrics(base),
  };
}

export function buildEmptyWorkdaySummary(): WorkdaySummary {
  const base = {
    source: "empty" as const,
    emailsProcessed: 0,
    vorgaengePrepared: 0,
    criticalCount: 0,
    highPriorityCount: 0,
    preparedReplies: 0,
    archivePrepared: 0,
    newCustomers: 0,
    preparedOffers: 0,
    appointmentRequests: 0,
    sortedVorgaenge: [] as Vorgang[],
    todayAppointments: [] as WorkdayTerminItem[],
    summaryText: EMPTY_HINT,
    panelIntro: WORKDAY_PANEL_INTRO,
    panelPriorityHint:
      "Sobald neue Gmail-Nachrichten eingehen, sortiere ich deine Prioritäten.",
    panelArchiveHint: null,
    emptyHint: EMPTY_HINT,
  };

  return {
    ...base,
    statusMetrics: buildStatusMetrics(base),
  };
}

/** Mappt Gmail-Summary auf das bestehende DailyPlan-Modell — Design bleibt gleich. */
export function buildDailyPlanFromWorkdaySummary(
  summary: WorkdaySummary,
  firstName: string | null = null
): DailyPlan {
  const greeting = buildWorkdayGreeting(firstName);
  const userName = firstName ?? "du";
  const priorityVorgaenge = getPriorityVorgaenge(summary.sortedVorgaenge);
  const prioritizedItems = priorityVorgaenge.map((item, index) =>
    mapVorgangToPriorityItem(item, index + 1)
  );
  const serviceItems = summary.sortedVorgaenge.filter(
    (item) => !shouldPrepareArchive(item)
  );

  const top = prioritizedItems[0];
  const mockFallback = createDailyPlan(undefined, userName);

  if (!top) {
    return {
      ...mockFallback,
      greeting,
      summary: summary.summaryText,
      prioritizedItems: [],
      statusMetrics: summary.statusMetrics,
      helpyRecommendation:
        summary.emptyHint ??
        "Sobald neue Gmail-Nachrichten eingehen, sortiere ich deine Prioritäten.",
      nextBestAction: "Als Nächstes: Gmail-Nachrichten prüfen lassen.",
      progressPercent: 0,
      progressMessage: "Noch keine echten Eingänge verarbeitet.",
    };
  }

  return {
    greeting,
    summary: summary.summaryText,
    prioritizedItems,
    wichtigsteAufgabe: top,
    helpyRecommendation: `Ich habe deine wichtigsten Gmail-Vorgänge sortiert. Ich würde zuerst „${top.titel}“ prüfen — ${top.priorisierungsGrund}`,
    nextBestAction: `Nächster bester Schritt: ${top.empfohleneAktion}`,
    statusMetrics: summary.statusMetrics,
    progressPercent: Math.min(
      90,
      Math.round(
        (serviceItems.length / Math.max(summary.vorgaengePrepared, 1)) * 70
      ) + 20
    ),
    progressMessage:
      summary.criticalCount + summary.highPriorityCount > 0
        ? "Priorisiere zuerst die dringlichen Gmail-Vorgänge."
        : "Deine Gmail-Vorgänge sind vorbereitet und warten auf deine Prüfung.",
    userName,
  };
}

export const WORKDAY_METRIC_PLACEHOLDERS: DailyPlanStatusMetric[] = [
  { label: "E-Mails verarbeitet", value: 0 },
  { label: "Vorgänge vorbereitet", value: 0 },
  { label: "Hohe Priorität", value: 0 },
  { label: "Antworten vorbereitet", value: 0 },
  { label: "Zum Archivieren vorbereitet", value: 0 },
  { label: "Termine / Besichtigungen erkannt", value: 0 },
];
