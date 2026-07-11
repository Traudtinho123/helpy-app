"use client";

import {
  Archive,
  Calendar,
  CircleDot,
  FileText,
  Inbox,
  MailWarning,
  Receipt,
  Star,
} from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { InboxFilter, InboxFilterItem } from "@/features/gmail/mock/mock-emails";
import { cn } from "@/lib/utils";

const filterItems: InboxFilterItem[] = [
  { id: "heute", label: "Heute", icon: Inbox },
  { id: "neu", label: "Neu", icon: CircleDot },
  { id: "wichtig", label: "Wichtig", icon: Star },
  { id: "antwort-noetig", label: "Antwort nötig", icon: MailWarning },
  { id: "angebote", label: "Angebote", icon: FileText },
  { id: "rechnungen", label: "Rechnungen", icon: Receipt },
  { id: "termine", label: "Termine", icon: Calendar },
  { id: "archiv", label: "Archiv", icon: Archive },
];

type InboxSidebarProps = {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  counts: Record<InboxFilter, number>;
};

export function InboxSidebar({
  activeFilter,
  onFilterChange,
  counts,
}: InboxSidebarProps) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#CBD5E1]/50 bg-white/60 backdrop-blur-xl">
      <div className="border-b border-[#CBD5E1]/40 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <HelpyAvatar size="sm" />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              Posteingang
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              HELPY Filter
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {filterItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeFilter === id;
          const count = counts[id];

          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-medium transition-all duration-300",
                isActive
                  ? "bg-white text-[#2563EB] shadow-[0_2px_12px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
                  : "text-[#475569] hover:bg-white/70 hover:text-[#0F172A]"
              )}
            >
              <Icon
                className={cn(
                  "size-[16px] shrink-0",
                  isActive ? "text-[#2563EB]" : "text-[#64748B]"
                )}
                strokeWidth={2}
              />
              <span className="flex-1 text-left tracking-[-0.01em]">{label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-[#2563EB]/10 text-[#2563EB]"
                      : "bg-[#F1F5F9] text-[#64748B]"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
