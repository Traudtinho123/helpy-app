"use client";

import { Lightbulb } from "lucide-react";
import { useWorkspaceContext } from "@/features/workspace/context";
import { cn } from "@/lib/utils";

type HelpyEmpfiehltWorkspaceCompactProps = {
  className?: string;
};

function buildCompactText(decisionTitle: string, nextBestStep: string): string {
  const parts = [decisionTitle, nextBestStep].filter(Boolean);
  return parts.slice(0, 2).join(" — ");
}

export function HelpyEmpfiehltWorkspaceCompact({
  className,
}: HelpyEmpfiehltWorkspaceCompactProps) {
  const { recommendation, currentWorkflow } = useWorkspaceContext();

  if (!recommendation || currentWorkflow.isArchive) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/45 px-3 py-2.5",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#2563EB]" strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.04em] text-[#2563EB] uppercase">
            HELPY empfiehlt
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#334155]">
            {buildCompactText(recommendation.decisionTitle, recommendation.nextBestStep)}
          </p>
        </div>
      </div>
    </div>
  );
}
