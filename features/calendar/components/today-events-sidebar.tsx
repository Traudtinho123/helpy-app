"use client";

import { eventTypeStyles } from "@/features/calendar/mock/mock-calendar";
import {
  dateFromDay,
  getEventsForDay,
  getSidebarLabel,
  TODAY_DAY,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import { cn } from "@/lib/utils";

type TodayEventsSidebarProps = {
  selectedDay: number;
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
};

export function TodayEventsSidebar({
  selectedDay,
  selectedEventId,
  onSelectEvent,
}: TodayEventsSidebarProps) {
  useCalendarStore();
  const date = dateFromDay(selectedDay);
  const events = getEventsForDay(date);
  const heading = selectedDay === TODAY_DAY ? "Heute" : `${selectedDay}. Juli`;

  return (
    <div className="mt-5">
      <h3 className="mb-3 px-1 text-[11px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">
        {heading}
      </h3>
      {events.length === 0 ? (
        <p className="px-1 text-[12px] text-[#94A3B8]">Keine Termine</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const styles = eventTypeStyles[event.type];
            const isSelected = selectedEventId === event.id;

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event.id)}
                className={cn(
                  "flex w-full gap-3 rounded-[16px] border p-3.5 text-left transition-all duration-300",
                  isSelected
                    ? "border-[#2563EB]/30 bg-white shadow-[0_2px_16px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
                    : "border-[#CBD5E1]/40 bg-white/80 hover:border-[#2563EB]/20 hover:shadow-sm",
                  event.sourceEmailId && "helpy-fade-in"
                )}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span className={cn("size-2 rounded-full", styles.dot)} />
                  <span className="text-[11px] font-semibold tabular-nums text-[#64748B]">
                    {event.time}
                  </span>
                </div>
                <p className="text-[12px] font-medium leading-snug text-[#0F172A]">
                  {getSidebarLabel(event)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
