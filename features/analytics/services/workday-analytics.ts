import {
  fetchCompletedAtInRange,
  fetchNewCustomersInRange,
  fetchTermineStartsInRange,
  fetchVoiceCallStartedAtInRange,
  fetchVorgangEventsInRange,
  type VorgangEventRow,
} from "@/features/analytics/services/vorgang-events-repository";
import {
  DEFAULT_ANALYTICS_TIMEZONE,
  endOfWeekInTimezone,
  getDateKeyInTimezone,
  getHourInTimezone,
  getWeekdayIndexInTimezone,
  startOfDayInTimezone,
  startOfWeekInTimezone,
  WEEKDAY_LABELS_DE,
  formatHourLabel,
} from "@/lib/datetime/timezone-week";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MetricTrend = "up" | "down" | "flat";

export type WorkdayKpiMetric = {
  id: string;
  label: string;
  current: number;
  previous: number;
  changePercent: number;
  trend: MetricTrend;
  sparkline: number[];
  mode?: "week-over-week" | "snapshot";
  snapshotHint?: string;
};

export type WorkdayHourlyBucket = {
  hour: number;
  label: string;
  count: number;
};

export type WorkdayDailyBucket = {
  dayIndex: number;
  label: string;
  current: number;
  previous: number;
};

export type WorkdayAnalytics = {
  timezone: string;
  weekStart: string;
  weekEnd: string;
  kpis: WorkdayKpiMetric[];
  todayHourly: WorkdayHourlyBucket[];
  weekDaily: WorkdayDailyBucket[];
  hasEventData: boolean;
  workHoursStart: number;
  workHoursEnd: number;
};

function computeTrend(current: number, previous: number): {
  changePercent: number;
  trend: MetricTrend;
} {
  if (current === previous) {
    return { changePercent: 0, trend: "flat" };
  }
  if (previous === 0) {
    return { changePercent: current > 0 ? 100 : 0, trend: current > 0 ? "up" : "flat" };
  }
  const changePercent = Math.round(((current - previous) / previous) * 100);
  return {
    changePercent,
    trend: changePercent > 0 ? "up" : "down",
  };
}

function isInRange(iso: string, fromMs: number, toMs: number): boolean {
  const ms = Date.parse(iso);
  return ms >= fromMs && ms <= toMs;
}

function countInRange(timestamps: string[], fromMs: number, toMs: number): number {
  return timestamps.filter((value) => isInRange(value, fromMs, toMs)).length;
}

function filterEvents(
  events: VorgangEventRow[],
  fromMs: number,
  toMs: number,
  predicate?: (event: VorgangEventRow) => boolean
): VorgangEventRow[] {
  return events.filter((event) => {
    if (!isInRange(event.received_at, fromMs, toMs)) return false;
    return predicate ? predicate(event) : true;
  });
}

function buildSparklineFromEvents(
  events: VorgangEventRow[],
  weekStart: Date,
  weekEnd: Date,
  timeZone: string,
  predicate?: (event: VorgangEventRow) => boolean
): number[] {
  const fromMs = weekStart.getTime();
  const toMs = weekEnd.getTime();
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const event of events) {
    if (!isInRange(event.received_at, fromMs, toMs)) continue;
    if (predicate && !predicate(event)) continue;
    counts[getWeekdayIndexInTimezone(event.received_at, timeZone)] += 1;
  }

  return counts;
}

function buildSparklineFromTimestamps(
  timestamps: string[],
  weekStart: Date,
  weekEnd: Date,
  timeZone: string
): number[] {
  const fromMs = weekStart.getTime();
  const toMs = weekEnd.getTime();
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const value of timestamps) {
    if (!isInRange(value, fromMs, toMs)) continue;
    counts[getWeekdayIndexInTimezone(value, timeZone)] += 1;
  }

  return counts;
}

function buildKpi(
  id: string,
  label: string,
  current: number,
  previous: number,
  sparkline: number[],
  options?: { mode?: "week-over-week" | "snapshot"; snapshotHint?: string }
): WorkdayKpiMetric {
  const { changePercent, trend } = computeTrend(current, previous);
  return {
    id,
    label,
    current,
    previous,
    changePercent,
    trend,
    sparkline,
    mode: options?.mode ?? "week-over-week",
    snapshotHint: options?.snapshotHint,
  };
}

export async function buildWorkdayAnalytics(
  supabase: SupabaseClient,
  companyId: string,
  options?: {
    now?: Date;
    timeZone?: string;
    workHoursStart?: number;
    workHoursEnd?: number;
  }
): Promise<WorkdayAnalytics> {
  const now = options?.now ?? new Date();
  const timeZone = options?.timeZone ?? DEFAULT_ANALYTICS_TIMEZONE;
  const workHoursStart = options?.workHoursStart ?? 8;
  const workHoursEnd = options?.workHoursEnd ?? 20;

  const thisWeekStart = startOfWeekInTimezone(now, timeZone);
  const thisWeekEnd = endOfWeekInTimezone(now, timeZone);
  const prevWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekEnd = new Date(thisWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayKey = getDateKeyInTimezone(now.toISOString(), timeZone);

  const [events, completedTimestamps, customerTimestamps, voiceTimestamps, termineThisWeek, termineUpcoming] =
    await Promise.all([
    fetchVorgangEventsInRange(
      supabase,
      companyId,
      prevWeekStart.toISOString(),
      thisWeekEnd.toISOString()
    ),
    fetchCompletedAtInRange(
      supabase,
      companyId,
      prevWeekStart.toISOString(),
      thisWeekEnd.toISOString()
    ),
    fetchNewCustomersInRange(
      supabase,
      companyId,
      prevWeekStart.toISOString(),
      thisWeekEnd.toISOString()
    ),
    fetchVoiceCallStartedAtInRange(
      companyId,
      prevWeekStart.toISOString(),
      thisWeekEnd.toISOString()
    ),
    fetchTermineStartsInRange(
      supabase,
      companyId,
      thisWeekStart.toISOString(),
      thisWeekEnd.toISOString()
    ),
    fetchTermineStartsInRange(
      supabase,
      companyId,
      thisWeekStart.toISOString(),
      thisWeekEnd.toISOString(),
      { upcomingOnly: true, nowIso: now.toISOString() }
    ),
  ]);

  const terminePrevWeek = await fetchTermineStartsInRange(
    supabase,
    companyId,
    prevWeekStart.toISOString(),
    prevWeekEnd.toISOString()
  );

  const thisWeekFrom = thisWeekStart.getTime();
  const thisWeekTo = thisWeekEnd.getTime();
  const prevWeekFrom = prevWeekStart.getTime();
  const prevWeekTo = prevWeekEnd.getTime();

  const kpis: WorkdayKpiMetric[] = [
    buildKpi(
      "appointments",
      "Besichtigungsanfragen",
      filterEvents(events, thisWeekFrom, thisWeekTo, (event) => event.is_appointment_request).length,
      filterEvents(events, prevWeekFrom, prevWeekTo, (event) => event.is_appointment_request).length,
      buildSparklineFromEvents(events, thisWeekStart, thisWeekEnd, timeZone, (event) => event.is_appointment_request)
    ),
    buildKpi(
      "inquiries",
      "Neue Interessenten",
      filterEvents(events, thisWeekFrom, thisWeekTo, (event) => event.is_new_inquiry).length,
      filterEvents(events, prevWeekFrom, prevWeekTo, (event) => event.is_new_inquiry).length,
      buildSparklineFromEvents(events, thisWeekStart, thisWeekEnd, timeZone, (event) => event.is_new_inquiry)
    ),
    buildKpi(
      "voice-calls",
      "KI-Telefonate",
      countInRange(voiceTimestamps, thisWeekFrom, thisWeekTo),
      countInRange(voiceTimestamps, prevWeekFrom, prevWeekTo),
      buildSparklineFromTimestamps(voiceTimestamps, thisWeekStart, thisWeekEnd, timeZone)
    ),
    buildKpi(
      "processed",
      "Verarbeitete Vorgänge",
      filterEvents(events, thisWeekFrom, thisWeekTo).length,
      filterEvents(events, prevWeekFrom, prevWeekTo).length,
      buildSparklineFromEvents(events, thisWeekStart, thisWeekEnd, timeZone)
    ),
    buildKpi(
      "completed",
      "Erledigte Vorgänge",
      countInRange(completedTimestamps, thisWeekFrom, thisWeekTo),
      countInRange(completedTimestamps, prevWeekFrom, prevWeekTo),
      buildSparklineFromTimestamps(completedTimestamps, thisWeekStart, thisWeekEnd, timeZone)
    ),
  ];

  if (termineUpcoming.length > 0) {
    kpis.splice(3, 0, buildKpi(
      "appointments-upcoming",
      "Termine noch diese Woche",
      termineUpcoming.length,
      0,
      buildSparklineFromTimestamps(termineThisWeek, thisWeekStart, thisWeekEnd, timeZone),
      { mode: "snapshot", snapshotHint: "Noch anstehend" }
    ));
  } else if (termineThisWeek.length > 0 || terminePrevWeek.length > 0) {
    kpis.splice(3, 0, buildKpi(
      "appointments-scheduled",
      "Termine diese Woche",
      termineThisWeek.length,
      terminePrevWeek.length,
      buildSparklineFromTimestamps(termineThisWeek, thisWeekStart, thisWeekEnd, timeZone)
    ));
  }

  const customersCurrent = countInRange(customerTimestamps, thisWeekFrom, thisWeekTo);
  const customersPrevious = countInRange(customerTimestamps, prevWeekFrom, prevWeekTo);
  if (customersCurrent > 0 || customersPrevious > 0) {
    kpis.push(
      buildKpi(
        "customers",
        "Neue Kunden",
        customersCurrent,
        customersPrevious,
        buildSparklineFromTimestamps(customerTimestamps, thisWeekStart, thisWeekEnd, timeZone)
      )
    );
  }

  const todayHourly: WorkdayHourlyBucket[] = [];
  for (let hour = workHoursStart; hour <= workHoursEnd; hour += 1) {
    const count = events.filter((event) => {
      if (getDateKeyInTimezone(event.received_at, timeZone) !== todayKey) return false;
      return getHourInTimezone(event.received_at, timeZone) === hour;
    }).length;
    todayHourly.push({ hour, label: formatHourLabel(hour), count });
  }

  const weekDaily: WorkdayDailyBucket[] = WEEKDAY_LABELS_DE.map((label, dayIndex) => {
    const currentDayStart = new Date(thisWeekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    const previousDayStart = new Date(prevWeekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    return {
      dayIndex,
      label,
      current: filterEvents(
        events,
        startOfDayInTimezone(currentDayStart, timeZone).getTime(),
        startOfDayInTimezone(
          new Date(currentDayStart.getTime() + 24 * 60 * 60 * 1000),
          timeZone
        ).getTime() - 1
      ).length,
      previous: filterEvents(
        events,
        startOfDayInTimezone(previousDayStart, timeZone).getTime(),
        startOfDayInTimezone(
          new Date(previousDayStart.getTime() + 24 * 60 * 60 * 1000),
          timeZone
        ).getTime() - 1
      ).length,
    };
  });

  return {
    timezone: timeZone,
    weekStart: thisWeekStart.toISOString(),
    weekEnd: thisWeekEnd.toISOString(),
    kpis,
    todayHourly,
    weekDaily,
    hasEventData: events.length > 0,
    workHoursStart,
    workHoursEnd,
  };
}
