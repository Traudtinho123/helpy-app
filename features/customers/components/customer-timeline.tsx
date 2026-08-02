"use client";

import type { ComponentType } from "react";
import {
  Calendar,
  FileText,
  Mail,
  Phone,
  Receipt,
} from "lucide-react";
import {
  formatTimelineDate,
  sortTimeline,
  timelineTypeStyles,
  type Customer,
  type TimelineEntryType,
} from "@/features/customers/mock/mock-customers";
import { cn } from "@/lib/utils";

const timelineIcons: Record<
  TimelineEntryType,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  email: Mail,
  telefonat: Phone,
  termin: Calendar,
  angebot: FileText,
  rechnung: Receipt,
};

type CustomerTimelineProps = {
  customer: Customer;
};

function TimelineItem({
  entry,
  isLast,
}: {
  entry: Customer["timeline"][number];
  isLast: boolean;
}) {
  const styles = timelineTypeStyles[entry.type];
  const Icon = timelineIcons[entry.type];

  return (
    <div className="relative flex gap-4">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-[12px] border border-white shadow-sm",
            entry.type === "email" && "bg-[var(--accent-light)] text-[var(--accent)]",
            entry.type === "telefonat" && "bg-[#ECFDF5] text-[#047857]",
            entry.type === "termin" && "bg-[#FAF5FF] text-[#7C3AED]",
            entry.type === "angebot" && "bg-[#FFFBEB] text-[#B45309]",
            entry.type === "rechnung" && "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-[#CBD5E1]/60" />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", !isLast && "pb-6")}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              entry.type === "email" && "bg-[var(--accent-light)] text-[var(--accent)]",
              entry.type === "telefonat" && "bg-[#ECFDF5] text-[#047857]",
              entry.type === "termin" && "bg-[#FAF5FF] text-[#7C3AED]",
              entry.type === "angebot" && "bg-[#FFFBEB] text-[#B45309]",
              entry.type === "rechnung" && "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
            )}
          >
            {styles.label}
          </span>
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            {formatTimelineDate(entry.date, entry.time)}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
          {entry.title}
        </p>
        {entry.description && (
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {entry.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function CustomerTimeline({ customer }: CustomerTimelineProps) {
  const entries = sortTimeline(customer.timeline);

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            Timeline
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            E-Mails · Telefonate · Termine · Angebote · Rechnungen
          </p>
        </div>
        <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
          {entries.length} Einträge
        </span>
      </div>

      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
        {entries.map((entry, index) => (
          <TimelineItem
            key={entry.id}
            entry={entry}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
