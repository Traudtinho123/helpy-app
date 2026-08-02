"use client";

import {
  CalendarPlus,
  FileText,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function InboxActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3 backdrop-blur-sm">
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] px-3.5 text-[12px] font-medium text-[var(--text-secondary)] shadow-sm transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
      >
        <PenLine className="size-3.5" />
        Neue Nachricht
      </Button>
      <Button
        size="sm"
        className="h-9 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-3.5 text-[12px] font-medium text-white shadow-[0_2px_12px_rgba(37,99,235,0.3)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(37,99,235,0.4)]"
      >
        <Sparkles className="size-3.5" />
        Mit HELPY beantworten
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] px-3.5 text-[12px] font-medium text-[var(--text-secondary)] shadow-sm transition-all duration-300 hover:border-[#10B981]/30 hover:bg-[#ECFDF5] hover:text-[#047857]"
      >
        <CalendarPlus className="size-3.5" />
        Termin erstellen
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] px-3.5 text-[12px] font-medium text-[var(--text-secondary)] shadow-sm transition-all duration-300 hover:border-[#F59E0B]/30 hover:bg-[#FFFBEB] hover:text-[#B45309]"
      >
        <FileText className="size-3.5" />
        Angebot erstellen
      </Button>
    </div>
  );
}
