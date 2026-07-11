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
            entry.type === "email" && "bg-[#EFF6FF] text-[#2563EB]",
            entry.type === "telefonat" && "bg-[#ECFDF5] text-[#047857]",
            entry.type === "termin" && "bg-[#FAF5FF] text-[#7C3AED]",
            entry.type === "angebot" && "bg-[#FFFBEB] text-[#B45309]",
            entry.type === "rechnung" && "bg-[#F1F5F9] text-[#64748B]"
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
              entry.type === "email" && "bg-[#EFF6FF] text-[#2563EB]",
              entry.type === "telefonat" && "bg-[#ECFDF5] text-[#047857]",
              entry.type === "termin" && "bg-[#FAF5FF] text-[#7C3AED]",
              entry.type === "angebot" && "bg-[#FFFBEB] text-[#B45309]",
              entry.type === "rechnung" && "bg-[#F1F5F9] text-[#64748B]"
            )}
          >
            {styles.label}
          </span>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            {formatTimelineDate(entry.date, entry.time)}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] font-semibold text-[#0F172A]">
          {entry.title}
        </p>
        {entry.description && (
          <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
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
          <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            Timeline
          </h3>
          <p className="mt-0.5 text-[12px] text-[#64748B]">
            E-Mails · Telefonate · Termine · Angebote · Rechnungen
          </p>
        </div>
        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-medium text-[#64748B]">
          {entries.length} Einträge
        </span>
      </div>

      <div className="rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-6 shadow-sm">
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
