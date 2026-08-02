"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Clock,
  Lightbulb,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { BlockTimeModal } from "@/features/calendar/components/block-time-modal";
import { buildCalendarInsights } from "@/features/calendar/services/calendar-insights";
import {
  getAllCalendarEvents,
  getTodayDateString,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety";

type HelpyCalendarPanelProps = {
  selectedDate?: string;
};

export function HelpyCalendarPanel({ selectedDate }: HelpyCalendarPanelProps) {
  const revision = useCalendarStore();
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  const insights = useMemo(() => {
    void revision;
    return buildCalendarInsights(getAllCalendarEvents());
  }, [revision]);

  const blockDate = selectedDate ?? getTodayDateString();
  const freeTime = insights.freeTime;

  return (
    <>
      <HelpyPanelShell variant="helpy" className="flex w-[380px]">
        <div className="space-y-5 px-1">
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Hallo Viktor 👋
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {HELPY_PANEL_REVIEW_INTRO}
            </p>
          </div>

          <Card className="rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-[var(--accent)]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                  Heute wichtig
                </p>
                {insights.helpyTaskCount > 0 ? (
                  <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#4338CA]">
                    HELPY Aufgaben
                  </span>
                ) : null}
              </div>
              {insights.todayImportant.length === 0 ? (
                <p className="mt-3 text-[12px] text-[var(--text-muted)]">
                  Keine dringenden Aufgaben für heute.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {insights.todayImportant.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      >
                        <span className="size-1.5 rounded-full bg-[#6366F1]" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#10B981]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                  Freie Zeit erkannt
                </p>
              </div>
              {freeTime ? (
                <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  Zwischen{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {freeTime.from}
                  </span>{" "}
                  und{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {freeTime.to}
                  </span>{" "}
                  hast du keine Termine.
                </p>
              ) : (
                <p className="mt-3 text-[12px] text-[var(--text-muted)]">
                  Heute keine größere freie Zeit erkannt.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-9 w-full rounded-[12px] border-[var(--border)] text-[12px] font-medium"
                onClick={() => setBlockModalOpen(true)}
              >
                <CalendarPlus className="size-4" />
                Zeit blockieren
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                  Ich habe erkannt
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {insights.detected.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--text-secondary)]"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#FDE68A]/60 bg-[#FFFBEB]/50 py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#B45309]">
                  Mein Vorschlag
                </p>
              </div>
              <p className="mt-3 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
                &ldquo;{insights.suggestion}&rdquo;
              </p>
            </CardContent>
          </Card>
        </div>
      </HelpyPanelShell>

      <BlockTimeModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        date={blockDate}
        defaultTime={freeTime?.from ?? "11:15"}
      />
    </>
  );
}
