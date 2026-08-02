"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteArchivedVorgang,
  restoreVorgangFromArchive,
} from "@/features/workspace/services/vorgaenge/vorgang-restore-service";
import {
  resolveArchiveCategory,
} from "@/features/workspace/services/vorgaenge/vorgang-archive";
import {
  ARCHIVE_VORGANG_FILTER_LABELS,
  type Vorgang,
} from "@/features/workspace/services/vorgaenge/types";
import { cn } from "@/lib/utils";

type VorgangArchiveCardProps = {
  vorgang: Vorgang;
  onChanged?: () => void;
};

export function VorgangArchiveCard({
  vorgang,
  onChanged,
}: VorgangArchiveCardProps) {
  const [busy, setBusy] = useState<"restore" | "delete" | null>(null);
  const category = resolveArchiveCategory(vorgang);
  const sender = vorgang.absenderEmail ?? vorgang.from ?? vorgang.kunde;

  const handleRestore = async () => {
    setBusy("restore");
    const result = await restoreVorgangFromArchive(vorgang);
    setBusy(null);
    if (result.ok) onChanged?.();
  };

  const handleDelete = async () => {
    setBusy("delete");
    const result = await deleteArchivedVorgang(vorgang);
    setBusy(null);
    if (result.ok) onChanged?.();
  };

  return (
    <article
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/80 p-4",
        "min-h-[72px]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[var(--text-secondary)]">
            {sender}
          </p>
          <p className="mt-0.5 truncate text-[14px] font-semibold text-[var(--text-primary)]">
            {vorgang.titel}
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            {ARCHIVE_VORGANG_FILTER_LABELS[category]} · {vorgang.receivedLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] flex-1 justify-center rounded-[10px] text-[13px]"
          disabled={busy !== null}
          onClick={() => void handleRestore()}
        >
          <RotateCcw className="mr-2 size-3.5" />
          {busy === "restore" ? "Verschiebe…" : "Als echter Vorgang markieren"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] rounded-[10px] text-[13px] text-[#B91C1C] hover:text-[#B91C1C]"
          disabled={busy !== null}
          onClick={() => void handleDelete()}
        >
          <Trash2 className="mr-2 size-3.5" />
          {busy === "delete" ? "Lösche…" : "Definitiv löschen"}
        </Button>
      </div>
    </article>
  );
}
