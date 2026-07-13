"use client";

import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  completeVorgang,
  VORGANG_ERLEDIGT_PANEL_MESSAGE,
  VORGANG_ERLEDIGT_SUCCESS,
} from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import {
  clearVorgangSelection,
  getSelectedVorgangIds,
  subscribeVorgaengeSelection,
} from "@/features/workspace/services/vorgaenge/vorgaenge-selection-store";
import {
  setBulkPriorityOverride,
  subscribePriorityOverrides,
} from "@/features/workspace/services/vorgaenge/vorgaenge-priority-override-store";
import { hideVorgang } from "@/features/workspace/services/vorgang-visibility-store";
import type { Vorgang, VorgangPriority } from "@/features/workspace/services/vorgaenge/types";
import { VORGANG_PRIORITY_LABELS } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type VorgaengeBulkBarProps = {
  vorgaenge: Vorgang[];
  onCompleted: (message: string, helpyPanelMessage: string) => void;
  className?: string;
};

export function VorgaengeBulkBar({
  vorgaenge,
  onCompleted,
  className,
}: VorgaengeBulkBarProps) {
  useExternalStore(subscribePriorityOverrides, () => null, () => null);
  const selectedIds = useExternalStore(
    subscribeVorgaengeSelection,
    getSelectedVorgangIds,
    () => [] as string[]
  );
  const [loading, setLoading] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const selectedVorgaenge = useMemo(
    () => vorgaenge.filter((item) => selectedIds.includes(item.id)),
    [selectedIds, vorgaenge]
  );

  if (selectedIds.length === 0) return null;

  const handleBulkComplete = async () => {
    setLoading(true);
    const supabase = createClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const token = session?.provider_token ?? null;

    for (const vorgang of selectedVorgaenge) {
      await completeVorgang(vorgang, token);
    }

    setLoading(false);
    clearVorgangSelection();
    onCompleted(
      `${selectedVorgaenge.length} Vorgänge erledigt.`,
      VORGANG_ERLEDIGT_PANEL_MESSAGE
    );
  };

  const handleBulkArchive = () => {
    for (const vorgang of selectedVorgaenge) {
      hideVorgang(vorgang.id);
    }
    clearVorgangSelection();
    onCompleted(
      `${selectedVorgaenge.length} Vorgänge archiviert.`,
      "Archivierte Vorgänge sind aus der Liste ausgeblendet."
    );
  };

  const handleSetPriority = (priority: VorgangPriority) => {
    setBulkPriorityOverride(selectedIds, priority);
    setShowPriorityMenu(false);
    clearVorgangSelection();
    onCompleted(
      `Priorität „${VORGANG_PRIORITY_LABELS[priority]}“ für ${selectedIds.length} Vorgänge gesetzt.`,
      VORGANG_ERLEDIGT_SUCCESS
    );
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/95 px-4 py-3 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <span className="text-[13px] font-semibold text-[#0F172A]">
        {selectedIds.length} ausgewählt
      </span>
      <Button
        type="button"
        size="sm"
        disabled={loading}
        onClick={() => {
          void handleBulkComplete();
        }}
        className="h-8 gap-1.5 rounded-[10px] text-[11px]"
      >
        <CheckCircle2 className="size-3.5" />
        Alle erledigen
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleBulkArchive}
        className="h-8 gap-1.5 rounded-[10px] border-[#CBD5E1]/60 text-[11px]"
      >
        <Archive className="size-3.5" />
        Alle archivieren
      </Button>
      <div className="relative">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowPriorityMenu((open) => !open)}
          className="h-8 gap-1.5 rounded-[10px] border-[#CBD5E1]/60 text-[11px]"
        >
          <Flag className="size-3.5" />
          Priorität setzen
        </Button>
        {showPriorityMenu ? (
          <div className="absolute left-0 top-full z-30 mt-1 min-w-[140px] rounded-[12px] border border-[#E2E8F0] bg-white py-1 shadow-lg">
            {(["kritisch", "hoch", "mittel", "niedrig"] as VorgangPriority[]).map(
              (priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleSetPriority(priority)}
                  className="block w-full px-3 py-2 text-left text-[12px] text-[#334155] hover:bg-[#F8FAFC]"
                >
                  {VORGANG_PRIORITY_LABELS[priority]}
                </button>
              )
            )}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={clearVorgangSelection}
        className="ml-auto text-[11px] font-medium text-[#64748B] hover:text-[#0F172A]"
      >
        Auswahl aufheben
      </button>
    </div>
  );
}
