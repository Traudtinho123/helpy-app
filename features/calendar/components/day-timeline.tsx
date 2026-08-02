"use client";

import { Sparkles } from "lucide-react";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { HelpyIconBadge } from "@/components/helpy/helpy-icon-badge";
import { eventTypeStyles, type CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import {
  dateFromDay,
  formatDayLabel,
  getEventsForDay,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import { cn } from "@/lib/utils";

type DayTimelineProps = {
  selectedDay: number;
  selectedEventId: string;
};

function TimelineItem({
  event,
  isSelected,
}: {
  event: CalendarEvent;
  isSelected: boolean;
}) {
  const styles = eventTypeStyles[event.type];

  return (
    <div
      id={`event-${event.id}`}
      className={cn(
        "relative flex gap-5 transition-all duration-300",
        isSelected && "helpy-fade-in"
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-end pt-1">
        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
          {event.time}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col pb-8">
        <div className="absolute top-2 -left-[1.625rem] size-3 rounded-full border-2 border-white bg-[#2563EB] shadow-sm" />
        <div
          className={cn(
            "rounded-[20px] border border-[var(--border)] border-l-4 bg-[var(--bg-surface)] p-5 shadow-sm transition-all duration-300",
            styles.ring,
            isSelected &&
              "shadow-[0_4px_24px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15",
            event.sourceEmailId && "helpy-fade-in"
          )}
        >
          <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">
            {event.title}
          </h4>
          {event.subtitle && (
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{event.subtitle}</p>
          )}

          <div className="mt-4 rounded-[14px] border border-[var(--border-accent)]/50 bg-[var(--accent-light)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-[var(--accent)]" strokeWidth={2} />
              <p className="text-[10px] font-semibold tracking-wide text-[var(--accent)] uppercase">
                HELPY Hinweis
              </p>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {event.helpyHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DayTimeline({ selectedDay, selectedEventId }: DayTimelineProps) {
  useCalendarStore();
  const date = dateFromDay(selectedDay);
  const events = getEventsForDay(date);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5 lg:px-8">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Kalender
        </h2>
        <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
          HELPY organisiert deinen Arbeitstag.
        </p>
        <p className="mt-2 text-[12px] font-medium text-[var(--text-muted)]">
          {formatDayLabel(selectedDay)} · Tagesübersicht
        </p>
      </div>

      <div className="relative px-6 py-8 lg:px-8">
        {events.length > 0 ? (
          <>
            <div className="absolute top-8 bottom-8 left-[4.75rem] w-px bg-[#CBD5E1]/60" />
            <div className="space-y-0">
              {events.map((event) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isSelected={event.id === selectedEventId}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] py-16 text-center">
            <HelpyCharacter size={64} pose="idle" animated showLabel={false} />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">
              Keine Termine an diesem Tag.
            </p>
          </div>
        )}

        {events.length > 0 && selectedDay === 6 && (
          <div className="mt-4 flex items-center gap-2 rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <HelpyIconBadge size={14} pose="typing" />
            <p className="text-[12px] text-[var(--text-secondary)]">
              Freie Zeit erkannt: 11:15 – 13:30 Uhr
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
