"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/Panel";
import { HelpyAtDesk } from "@/components/helpy/helpy-at-desk";
import { cn } from "@/lib/utils";

type HelpyPanelShellProps = {
  subtitle?: string;
  headerBadge?: ReactNode;
  variant?: "sidebar" | "helpy" | "workspace";
  className?: string;
  panelHeaderClassName?: string;
  panelBodyClassName?: string;
  deskCompact?: boolean;
  showDesk?: boolean;
  showOnlineBadge?: boolean;
  footer?: ReactNode;
  children: ReactNode;
};

function OnlineBadge() {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-light)] px-2.5 text-[10px] font-semibold text-[var(--success)]"
    >
      <span
        aria-hidden
        className="helpy-online-pulse size-1.5 rounded-full bg-[var(--success)]"
      />
      Online
    </Badge>
  );
}

export function HelpyPanelShell({
  subtitle = "Dein KI-Bürokollege",
  headerBadge,
  variant = "helpy",
  className,
  panelHeaderClassName,
  panelBodyClassName,
  deskCompact = false,
  showDesk = true,
  showOnlineBadge = false,
  footer,
  children,
}: HelpyPanelShellProps) {
  return (
    <Panel variant={variant} className={className}>
      <PanelHeader className={cn("px-5 pb-3", panelHeaderClassName)}>
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <h2 className="helpy-h2 text-sm">HELPY</h2>
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
              {subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerBadge}
            {showOnlineBadge ? <OnlineBadge /> : null}
          </div>
        </div>
      </PanelHeader>

      <PanelBody
        className={cn("overflow-y-visible py-0 pb-5", panelBodyClassName)}
      >
        {showDesk ? (
          <div className="px-1 pb-4">
            <HelpyAtDesk compact={deskCompact} />
          </div>
        ) : null}
        {children}
      </PanelBody>

      {footer ? <PanelFooter>{footer}</PanelFooter> : null}
    </Panel>
  );
}
