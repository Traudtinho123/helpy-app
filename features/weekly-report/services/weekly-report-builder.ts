import type { MetricTrend } from "@/features/analytics/services/workday-analytics";
import type {
  VorgangEventDetailRow,
  VorgangEventRow,
} from "@/features/analytics/services/vorgang-events-repository";
import {
  deriveFollowUpRecommendation,
  deriveFollowUpStatus,
  FOLLOWUP_DAY_THRESHOLDS,
} from "@/features/followup/services/followup-rules";
import type {
  WeeklyReportData,
  WeeklyReportMetric,
  WeeklyReportRecommendation,
  WeeklyReportStaleItem,
  WeeklyReportTrend,
} from "@/features/weekly-report/types/weekly-report-types";
import {
  DEFAULT_ANALYTICS_TIMEZONE,
  getIsoWeekKeyInTimezone,
  getIsoWeekNumberInTimezone,
  getPreviousWeekRangeInTimezone,
} from "@/lib/datetime/timezone-week";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchCompletedAtInRange,
  fetchCompletedVorgangKeys,
  fetchNewCustomersInRange,
  fetchVorgangEventDetailsSince,
  fetchVorgangEventsInRange,
} from "@/features/analytics/services/vorgang-events-repository";

const STALE_DAYS_THRESHOLD = 3;
const MAX_STALE_LIST = 5;
const MAX_RECOMMENDATIONS = 3;
const LOW_ACTIVITY_EVENT_THRESHOLD = 2;

function isInRange(iso: string, fromMs: number, toMs: number): boolean {
  const ms = Date.parse(iso);
  return ms >= fromMs && ms <= toMs;
}

function countEvents(
  events: VorgangEventRow[],
  fromMs: number,
  toMs: number,
  predicate?: (event: VorgangEventRow) => boolean
): number {
  return events.filter((event) => {
    if (!isInRange(event.received_at, fromMs, toMs)) return false;
    return predicate ? predicate(event) : true;
  }).length;
}

function countTimestamps(
  timestamps: string[],
  fromMs: number,
  toMs: number
): number {
  return timestamps.filter((value) => isInRange(value, fromMs, toMs)).length;
}

function computeTrend(current: number, previous: number): {
  trend: WeeklyReportTrend;
  changeLabel: string;
} {
  if (current === previous) {
    return { trend: "flat", changeLabel: "→ gleich wie Vorwoche" };
  }
  if (current > previous) {
    const delta = current - previous;
    return { trend: "up", changeLabel: `↑ ${delta} mehr als Vorwoche` };
  }
  const delta = previous - current;
  return { trend: "down", changeLabel: `↓ ${delta} weniger als Vorwoche` };
}

function buildMetric(
  id: string,
  label: string,
  current: number,
  previous: number
): WeeklyReportMetric {
  const { trend, changeLabel } = computeTrend(current, previous);
  return { id, label, current, previous, trend, changeLabel };
}

function formatWeekLabel(start: Date, end: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function resolveOpenVorgaenge(
  details: VorgangEventDetailRow[],
  completed: { vorgangIds: Set<string>; threadIds: Set<string> },
  now: Date
): WeeklyReportStaleItem[] {
  const latestByVorgang = new Map<string, VorgangEventDetailRow>();

  for (const row of details) {
    const existing = latestByVorgang.get(row.vorgang_id);
    if (!existing || Date.parse(row.received_at) > Date.parse(existing.received_at)) {
      latestByVorgang.set(row.vorgang_id, row);
    }
  }

  const openItems: WeeklyReportStaleItem[] = [];

  for (const row of latestByVorgang.values()) {
    if (completed.vorgangIds.has(row.vorgang_id)) continue;
    if (completed.threadIds.has(row.provider_thread_id)) continue;

    const receivedMs = Date.parse(row.received_at);
    const daysWaiting = Math.max(
      0,
      Math.floor((now.getTime() - receivedMs) / 86_400_000)
    );

    openItems.push({
      vorgangId: row.vorgang_id,
      kundeName: row.kunde_name?.trim() || "Unbekannter Kontakt",
      daysWaiting,
    });
  }

  return openItems.sort((a, b) => b.daysWaiting - a.daysWaiting);
}

function buildRecommendations(input: {
  staleWaiting: WeeklyReportStaleItem[];
  newInquiriesLastWeek: number;
  openTotal: number;
  isLowActivity: boolean;
}): WeeklyReportRecommendation[] {
  const items: WeeklyReportRecommendation[] = [];

  for (const item of input.staleWaiting) {
    if (items.length >= MAX_RECOMMENDATIONS) break;
    if (item.daysWaiting < STALE_DAYS_THRESHOLD) continue;

    const status = deriveFollowUpStatus(item.daysWaiting, "warten");
    const base = deriveFollowUpRecommendation(status, item.daysWaiting);

    if (item.daysWaiting >= FOLLOWUP_DAY_THRESHOLDS.dringend) {
      items.push({
        text: `${item.kundeName} wartet seit ${item.daysWaiting} Tagen — jetzt wäre ein guter Zeitpunkt für eine Nachfass-Mail oder einen kurzen Anruf.`,
      });
    } else {
      items.push({
        text: `${item.kundeName} wartet seit ${item.daysWaiting} Tagen. ${base}`,
      });
    }
  }

  if (items.length < MAX_RECOMMENDATIONS && input.newInquiriesLastWeek >= 3) {
    items.push({
      text: `Du hast letzte Woche ${input.newInquiriesLastWeek} neue Anfragen erhalten — prüfe die Prioritäten in HELPY.`,
    });
  } else if (
    items.length < MAX_RECOMMENDATIONS &&
    input.newInquiriesLastWeek > 0
  ) {
    items.push({
      text: `Du hast letzte Woche ${input.newInquiriesLastWeek} neue Anfrage${input.newInquiriesLastWeek === 1 ? "" : "n"} erhalten — starte mit den wichtigsten Vorgängen.`,
    });
  }

  if (items.length < MAX_RECOMMENDATIONS && input.openTotal >= 5) {
    items.push({
      text: `Du hast ${input.openTotal} offene Vorgänge — blocke heute 20 Minuten für die wichtigsten Antworten.`,
    });
  }

  if (items.length === 0 && input.isLowActivity) {
    items.push({
      text: "Du hast HELPY letzte Woche noch kaum genutzt — verbinde dein Postfach und starte heute mit deinen Vorgängen.",
    });
  }

  if (items.length === 0) {
    items.push({
      text: "Gute Basis — behalte offene Vorgänge im Blick und nutze HELPY für vorbereitete Antworten.",
    });
  }

  return items.slice(0, MAX_RECOMMENDATIONS);
}

function resolveAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export type BuildWeeklyReportInput = {
  companyId: string;
  companyName: string;
  recipientName: string | null;
  now?: Date;
  timeZone?: string;
};

export async function buildWeeklyReport(
  supabase: SupabaseClient,
  input: BuildWeeklyReportInput
): Promise<WeeklyReportData> {
  const now = input.now ?? new Date();
  const timeZone = input.timeZone ?? DEFAULT_ANALYTICS_TIMEZONE;
  const { start: lastWeekStart, end: lastWeekEnd } =
    getPreviousWeekRangeInTimezone(now, timeZone);
  const weekBeforeStart = new Date(lastWeekStart.getTime() - 7 * 86_400_000);
  const weekBeforeEnd = new Date(lastWeekEnd.getTime() - 7 * 86_400_000);

  const lastFrom = lastWeekStart.getTime();
  const lastTo = lastWeekEnd.getTime();
  const prevFrom = weekBeforeStart.getTime();
  const prevTo = weekBeforeEnd.getTime();

  const lookbackFrom = new Date(now.getTime() - 90 * 86_400_000).toISOString();

  const [events, completedTimestamps, customerTimestamps, eventDetails, completedKeys] =
    await Promise.all([
      fetchVorgangEventsInRange(
        supabase,
        input.companyId,
        weekBeforeStart.toISOString(),
        lastWeekEnd.toISOString()
      ),
      fetchCompletedAtInRange(
        supabase,
        input.companyId,
        weekBeforeStart.toISOString(),
        lastWeekEnd.toISOString()
      ),
      fetchNewCustomersInRange(
        supabase,
        input.companyId,
        weekBeforeStart.toISOString(),
        lastWeekEnd.toISOString()
      ),
      fetchVorgangEventDetailsSince(supabase, input.companyId, lookbackFrom),
      fetchCompletedVorgangKeys(supabase, input.companyId),
    ]);

  const companyDisplayName = input.companyName.trim() || "Dein Unternehmen";

  const newInquiriesLastWeek = countEvents(
    events,
    lastFrom,
    lastTo,
    (event) => event.is_new_inquiry
  );
  const newCustomersLastWeek = countTimestamps(customerTimestamps, lastFrom, lastTo);
  const newContactsLastWeek = newInquiriesLastWeek + newCustomersLastWeek;

  const metrics: WeeklyReportMetric[] = [
    buildMetric(
      "processed",
      "Verarbeitete Vorgänge",
      countEvents(events, lastFrom, lastTo),
      countEvents(events, prevFrom, prevTo)
    ),
    buildMetric(
      "new-contacts",
      "Neue Interessenten / Kunden",
      newContactsLastWeek,
      countEvents(events, prevFrom, prevTo, (event) => event.is_new_inquiry) +
        countTimestamps(customerTimestamps, prevFrom, prevTo)
    ),
    buildMetric(
      "completed",
      "Erledigte Vorgänge",
      countTimestamps(completedTimestamps, lastFrom, lastTo),
      countTimestamps(completedTimestamps, prevFrom, prevTo)
    ),
    buildMetric(
      "appointments",
      "Besichtigungsanfragen",
      countEvents(events, lastFrom, lastTo, (event) => event.is_appointment_request),
      countEvents(events, prevFrom, prevTo, (event) => event.is_appointment_request)
    ),
  ];

  const openItems = resolveOpenVorgaenge(eventDetails, completedKeys, now);
  const staleWaiting = openItems
    .filter((item) => item.daysWaiting >= STALE_DAYS_THRESHOLD)
    .slice(0, MAX_STALE_LIST);

  const isLowActivity =
    countEvents(events, lastFrom, lastTo) <= LOW_ACTIVITY_EVENT_THRESHOLD;

  const recommendations = buildRecommendations({
    staleWaiting,
    newInquiriesLastWeek,
    openTotal: openItems.length,
    isLowActivity,
  });

  const baseUrl = resolveAppBaseUrl();
  const weekKey = getIsoWeekKeyInTimezone(lastWeekStart, timeZone);

  return {
    weekKey,
    weekNumber: getIsoWeekNumberInTimezone(lastWeekStart, timeZone),
    weekLabel: formatWeekLabel(lastWeekStart, lastWeekEnd, timeZone),
    companyName: companyDisplayName,
    recipientName: input.recipientName,
    isLowActivity,
    metrics,
    staleWaiting,
    openTotal: openItems.length,
    recommendations,
    vorgaengeUrl: `${baseUrl}/vorgaenge`,
    settingsUrl: `${baseUrl}/einstellungen/unternehmen`,
  };
}

/** @internal exported for tests */
export function mapMetricTrendToArrow(trend: MetricTrend | WeeklyReportTrend): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}
