"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CalendarGreeting } from "@/features/calendar/components/calendar-greeting";
import { DayTimeline } from "@/features/calendar/components/day-timeline";
import { HelpyCalendarPanel } from "@/features/calendar/components/helpy-calendar-panel";
import { KalenderVorgangFocusPanel } from "@/features/calendar/components/kalender-vorgang-focus-panel";
import { MonthCalendar } from "@/features/calendar/components/month-calendar";
import { TodayEventsSidebar } from "@/features/calendar/components/today-events-sidebar";
import {
  dateFromDay,
  getEventsForDay,
  getTodayDayNumber,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import {
  getAppleCalendarServerSnapshot,
  getAppleCalendarSyncState,
  subscribeAppleCalendarSync,
} from "@/features/apple-calendar/services/apple-calendar-sync";

export function KalenderPage() {
  useCalendarStore();
  const searchParams = useSearchParams();
  const focusVorgangId = searchParams.get("vorgang");
  const focusMode = searchParams.get("focus");

  useSyncExternalStore(
    subscribeAppleCalendarSync,
    getAppleCalendarSyncState,
    getAppleCalendarServerSnapshot
  );

  const [selectedDay, setSelectedDay] = useState(getTodayDayNumber);
  const [selectedEventId, setSelectedEventId] = useState("");

  const dayEvents = useMemo(() => {
    const now = new Date();
    return getEventsForDay(
      dateFromDay(selectedDay, now.getMonth(), now.getFullYear())
    );
  }, [selectedDay]);

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
      rightPanel={<HelpyCalendarPanel />}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <CalendarGreeting />

        {focusVorgangId &&
          (focusMode === "besichtigung" || focusMode === "termin") && (
            <KalenderVorgangFocusPanel
              vorgangId={focusVorgangId}
              focus={focusMode}
            />
          )}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="w-full shrink-0 overflow-y-auto border-b border-[#CBD5E1]/50 bg-white/50 p-5 backdrop-blur-sm lg:w-[300px] lg:border-r lg:border-b-0 xl:w-[320px]">
            <MonthCalendar
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <TodayEventsSidebar
              selectedDay={selectedDay}
              selectedEventId={resolvedEventId}
              onSelectEvent={handleSelectEvent}
            />
          </aside>

          <DayTimeline
            selectedDay={selectedDay}
            selectedEventId={resolvedEventId}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
