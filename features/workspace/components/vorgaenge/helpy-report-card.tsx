"use client";

import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
import { resolveVorgangOpenPath } from "@/features/workspace/services/vorgaenge/gmail-workspace-resolver";
import {
  getHelpyReportReadAt,
  isHelpyReportUnread,
  markHelpyReportRead,
} from "@/features/workspace/services/vorgaenge/helpy-report-read-store";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type HelpyReportCardProps = {
  vorgang: Vorgang;
};

export function HelpyReportCard({ vorgang }: HelpyReportCardProps) {
  const workspacePath = resolveVorgangOpenPath(vorgang, getWorkspacePath);
  const unread = isHelpyReportUnread(vorgang.id);
  const readAt = vorgang.helpyReportReadAt ?? getHelpyReportReadAt(vorgang.id);

  const handleOpen = () => {
    if (!readAt) {
      markHelpyReportRead(vorgang.id);
    }
  };

  return (
    <article
      className={cn(
        "group rounded-[24px] border border-[#BFDBFE]/50 bg-gradient-to-br from-[#EFF6FF]/90 to-[#F8FAFC]/90 p-6",
        "shadow-[0_2px_8px_rgba(37,99,235,0.04),0_12px_40px_rgba(37,99,235,0.06)] ring-1 ring-[#DBEAFE]/80 backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[#93C5FD]/60"
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE]/60 bg-white/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-[#2563EB] uppercase">
          HELPY Report
        </span>
        {unread ? (
          <span className="rounded-full bg-[#E2E8F0] px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
            Neu
          </span>
        ) : (
          <span className="text-[10px] font-medium text-[#94A3B8]">Gelesen</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white/80 shadow-sm ring-1 ring-[#DBEAFE]/80">
          <HelpyAvatar size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
            {vorgang.intentLabel ?? "HELPY Report"}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {vorgang.titel}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#64748B]">
            <span>HELPY</span>
            <span className="text-[#CBD5E1]">·</span>
            <span>{vorgang.receivedLabel}</span>
          </div>
        </div>
      </div>

      {vorgang.summary && (
        <p className="mt-4 text-[12px] leading-relaxed text-[#475569] line-clamp-3">
          {vorgang.summary}
        </p>
      )}

      <div className="mt-4">
        <Link
          href={workspacePath}
          onClick={handleOpen}
          className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-[#BFDBFE]/70 bg-white/90 px-4 text-[12px] font-semibold text-[#2563EB] shadow-sm transition-all duration-300 hover:bg-white"
        >
          <ExternalLink className="size-3.5" />
          Report lesen
        </Link>
      </div>
    </article>
  );
}
