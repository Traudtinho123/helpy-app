"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { CalendarGreeting } from "@/features/calendar/components/calendar-greeting";
import { DayTimeline } from "@/features/calendar/components/day-timeline";
import { HelpyCalendarPanel } from "@/features/calendar/components/helpy-calendar-panel";
import { KalenderVorgangFocusPanel } from "@/features/calendar/components/kalender-vorgang-focus-panel";
import { MonthCalendar } from "@/features/calendar/components/month-calendar";
import { TodayEventsSidebar } from "@/features/calendar/components/today-events-sidebar";
import {
  dateFromParts,
  detectCalendarProviderMismatch,
  getEventsForDay,
  getTodayDayNumber,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import {
  getConnectedCalendarPlatform,
  reconcileCalendarPlatformState,
} from "@/features/calendar/services/calendar-platform";
import {
  getAppleCalendarServerSnapshot,
  getAppleCalendarSyncState,
  subscribeAppleCalendarSync,
  syncAppleCalendarEvents,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import { loadDbVorgaengeFromApi } from "@/features/vorgaenge/services/db-vorgaenge-store";

function createTodayView() {
  const today = new Date();
  return {
    month: today.getMonth(),
    year: today.getFullYear(),
    day: today.getDate(),
  };
}

export function KalenderPage() {
  const storeRevision = useCalendarStore();
  const searchParams = useSearchParams();
  const focusVorgangId = searchParams.get("vorgang");
  const focusMode = searchParams.get("focus");

  useSyncExternalStore(
    subscribeAppleCalendarSync,
    getAppleCalendarSyncState,
    getAppleCalendarServerSnapshot
  );

  const [viewMonth, setViewMonth] = useState(() => {
    const t = createTodayView();
    return { month: t.month, year: t.year };
  });
  const [selectedDay, setSelectedDay] = useState(getTodayDayNumber);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    const today = createTodayView();
    setSelectedDay(today.day);
    setViewMonth({ month: today.month, year: today.year });
    reconcileCalendarPlatformState();

    void loadDbVorgaengeFromApi();

    if (getConnectedCalendarPlatform() === "apple") {
      void syncAppleCalendarEvents();
    }
  }, []);

  const selectedDate = useMemo(
    () => dateFromParts(selectedDay, viewMonth.month, viewMonth.year),
    [selectedDay, viewMonth.month, viewMonth.year]
  );

  const showProviderMismatch = detectCalendarProviderMismatch();

  const handleResync = async () => {
    setResyncing(true);
    reconcileCalendarPlatformState();
    await syncAppleCalendarEvents();
    setResyncing(false);
  };

  const dayEvents = useMemo(() => {
    void storeRevision;
    return getEventsForDay(selectedDate);
  }, [selectedDate, storeRevision]);

  const resolvedEventId = useMemo(() => {
    if (dayEvents.length === 0) return "";
    if (dayEvents.some((event) => event.id === selectedEventId)) {
      return selectedEventId;
    }
    return dayEvents[0].id;
  }, [dayEvents, selectedEventId]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const el = document.getElementById(`event-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <DashboardShell
      activeHref="/kalender"
      rightPanel={<HelpyCalendarPanel selectedDate={selectedDate} />}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <CalendarGreeting />

        {showProviderMismatch ? (
          <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[12px] text-[#92400E]">
            <span>
              ⚠️ Apple Kalender verbunden, aber Google-Termine werden angezeigt.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={resyncing}
              onClick={() => void handleResync()}
              className="h-8 rounded-[10px] text-[11px]"
            >
              {resyncing ? "Synchronisiere…" : "Neu synchronisieren"}
            </Button>
          </div>
        ) : null}

        {focusVorgangId &&
          (focusMode === "besichtigung" || focusMode === "termin") && (
            <KalenderVorgangFocusPanel
              vorgangId={focusVorgangId}
              focus={focusMode}
            />
          )}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="w-full shrink-0 overflow-y-auto border-b border-[var(--border)] bg-[var(--bg-surface)] p-5 backdrop-blur-sm lg:w-[300px] lg:border-r lg:border-b-0 xl:w-[320px]">
            <MonthCalendar
              viewMonth={viewMonth}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onChangeMonth={setViewMonth}
            />
            <TodayEventsSidebar
              selectedDate={selectedDate}
              viewMonth={viewMonth}
              selectedEventId={resolvedEventId}
              onSelectEvent={handleSelectEvent}
            />
          </aside>

          <DayTimeline
            selectedDate={selectedDate}
            viewMonth={viewMonth}
            selectedDay={selectedDay}
            selectedEventId={resolvedEventId}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
