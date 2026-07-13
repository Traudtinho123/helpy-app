"use client";

import Link from "next/link";
import { CalendarDays, Clock, ExternalLink, MapPin } from "lucide-react";
import type { CalendarPlatform } from "@/features/calendar/services/calendar-platform";
import type { WorkdayTerminItem } from "@/features/workday/services/workday-summary";
import { cn } from "@/lib/utils";

type WorkdayTermineHeuteSectionProps = {
  appointments: WorkdayTerminItem[];
  calendarPlatform?: CalendarPlatform | null;
};

function formatTimeRange(termin: WorkdayTerminItem): string {
  if (!termin.uhrzeit) return "Ganztägig";
  if (termin.endUhrzeit) return `${termin.uhrzeit} – ${termin.endUhrzeit}`;
  return termin.uhrzeit;
}

function TerminDesktopCard({ termin }: { termin: WorkdayTerminItem }) {
  const mapsUrl = termin.ort
    ? `https://maps.google.com/?q=${encodeURIComponent(termin.ort)}`
    : null;

  return (
    <article
      className={cn(
        "w-[300px] shrink-0 snap-start rounded-[16px] border border-[#CBD5E1]/50 bg-white/95 p-4 shadow-sm"
      )}
    >
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#047857]">
        <Clock className="size-3.5" />
        {formatTimeRange(termin)}
      </p>
      <h3 className="mt-2 text-[14px] font-semibold leading-snug text-[#0F172A]">
        {termin.titel}
      </h3>
      <p className="mt-1 text-[12px] text-[#64748B]">{termin.kunde}</p>
      {termin.ort ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#94A3B8]">
          <MapPin className="size-3" />
          {termin.ort}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={termin.href}
          className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-semibold text-[#334155] hover:bg-[#F8FAFC]"
        >
          Details
        </Link>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-[10px] border border-[#BFDBFE]/60 bg-[#EFF6FF] px-3 text-[11px] font-semibold text-[#2563EB]"
          >
            Navigation
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function WorkdayTermineHeuteSection({
  appointments,
}: WorkdayTermineHeuteSectionProps) {
  const emptyMessage =
    "Keine Termine heute — du hast freie Zeit für deine Kunden.";

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#ECFDF5]">
          <CalendarDays className="size-5 text-[#047857]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="helpy-h2 text-[1.2rem]">Termine heute</h2>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            {appointments.length > 0
              ? `${appointments.length} Termin${appointments.length === 1 ? "" : "e"} geplant`
              : "Dein Kalender für heute"}
          </p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-4 py-6 text-center">
          <p className="text-[13px] leading-relaxed text-[#64748B]">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {appointments.map((termin) => (
              <li key={termin.id}>
                <Link
                  href={termin.href}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E2E8F0]/80 bg-white px-3 py-2.5 active:bg-[#F8FAFC]"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#047857]">
                      {formatTimeRange(termin)}
                    </p>
                    <p className="truncate text-[13px] font-medium text-[#0F172A]">
                      {termin.titel}
                    </p>
                    {termin.kunde ? (
                      <p className="truncate text-[11px] text-[#64748B]">{termin.kunde}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-[#2563EB]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex md:snap-x md:snap-mandatory [&::-webkit-scrollbar]:hidden">
            {appointments.map((termin) => (
              <TerminDesktopCard key={termin.id} termin={termin} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
