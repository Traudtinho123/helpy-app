"use client";

import { Shield } from "lucide-react";
import { DATA_PRIVACY_SIDEBAR_TOOLTIP } from "@/lib/privacy/data-privacy-copy";

export function DataPrivacySidebarHint() {
  return (
    <div className="group relative shrink-0 px-3 pb-4">
      <div
        title={DATA_PRIVACY_SIDEBAR_TOOLTIP}
        className="flex cursor-default items-center justify-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[var(--text-sidebar-muted)] transition-colors duration-150 hover:text-[var(--text-sidebar)]"
        aria-label={DATA_PRIVACY_SIDEBAR_TOOLTIP}
      >
        <Shield className="size-3.5" strokeWidth={2} />
        <span className="text-[10px] font-medium tracking-[0.02em]">
          Datenschutz
        </span>
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[var(--sidebar-active)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-sidebar)] opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100"
      >
        {DATA_PRIVACY_SIDEBAR_TOOLTIP}
      </div>
    </div>
  );
}
