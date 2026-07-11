"use client";

import { useEffect, type ComponentType } from "react";
import {
  CalendarDays,
  FileText,
  Handshake,
  UserRound,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/Panel";
import { WorkspacePanelContent } from "@/features/workspace/panels/workspace-panel-content";
import type {
  AnyWorkspacePanel,
  WorkspacePanelKind,
} from "@/features/workspace/panels/workspace-panel-types";
import { WORKSPACE_PANEL_DESCRIPTIONS } from "@/features/workspace/panels/workspace-panel-types";
import { cn } from "@/lib/utils";

type WorkspacePanelSlideOverProps = {
  panel: AnyWorkspacePanel | null;
  onClose: () => void;
};

const PANEL_ICONS: Record<
  WorkspacePanelKind,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  kunde: UserRound,
  objekt: Building2,
  dokument: FileText,
  termin: CalendarDays,
  angebot: Handshake,
};

export function WorkspacePanelSlideOver({
  panel,
  onClose,
}: WorkspacePanelSlideOverProps) {
  const isOpen = panel !== null;
  const Icon = panel ? PANEL_ICONS[panel.kind] : FileText;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Panel schließen"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[100] bg-[#0F172A]/20 backdrop-blur-[1px] transition-opacity duration-300",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-[110] flex w-[min(42vw,640px)] min-w-[320px] max-w-[45vw] flex-col border-l border-[#CBD5E1]/50 bg-white/95 shadow-[-8px_0_32px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {panel && (
          <>
            <PanelHeader className="h-auto min-h-[4.75rem] shrink-0 items-start py-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">
                  <Icon className="size-4.5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
                    Workspace-Panel
                  </p>
                  <h2 className="mt-0.5 text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
                    {panel.title}
                  </h2>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    {WORKSPACE_PANEL_DESCRIPTIONS[panel.kind]}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={onClose}
                className="size-9 shrink-0 rounded-[10px] border-[#CBD5E1]/60"
                aria-label="Panel schließen"
              >
                <X className="size-4" />
              </Button>
            </PanelHeader>

            <WorkspacePanelContent panel={panel} onClose={onClose} />
          </>
        )}
      </aside>
    </>
  );
}
