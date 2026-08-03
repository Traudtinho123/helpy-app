"use client";

import { useState } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import {
  isVorgangSelected,
  setVorgangSelected,
  subscribeVorgaengeSelection,
} from "@/features/workspace/services/vorgaenge/vorgaenge-selection-store";
import {
  deleteArchivedVorgang,
  restoreVorgangFromArchive,
} from "@/features/workspace/services/vorgaenge/vorgang-restore-service";
import { resolveArchiveCategory } from "@/features/workspace/services/vorgaenge/vorgang-archive";
import {
  ARCHIVE_VORGANG_FILTER_LABELS,
  type Vorgang,
} from "@/features/workspace/services/vorgaenge/types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const category = resolveArchiveCategory(vorgang);
  const sender = vorgang.absenderEmail ?? vorgang.from ?? vorgang.kunde;
  const isSelected = useExternalStore(
    subscribeVorgaengeSelection,
    () => isVorgangSelected(vorgang.id),
    () => false
  );

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
    setDeleteConfirmOpen(false);
    if (result.ok) onChanged?.();
  };

  return (
    <>
      <article
        className={cn(
          "rounded-xl border bg-[var(--bg-elevated)]/80 p-4 min-h-[72px] transition-colors",
          isSelected
            ? "border-[var(--border-accent)] bg-[var(--accent-light)]/35"
            : "border-[var(--border)]"
        )}
      >
        <div className="flex items-start gap-3">
          <label
            className={cn(
              "mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border border-[var(--border-strong)] bg-[var(--bg-surface)]",
              isSelected && "border-[var(--accent)] bg-[var(--accent-light)]"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              className="sr-only"
              onChange={() => setVorgangSelected(vorgang.id, !isSelected)}
            />
            {isSelected ? (
              <Check className="size-3 text-[var(--accent)]" strokeWidth={3} />
            ) : null}
          </label>

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
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="mr-2 size-3.5" />
            {busy === "delete" ? "Lösche…" : "Definitiv löschen"}
          </Button>
        </div>
      </article>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Sicher löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-[10px]"
              disabled={busy === "delete"}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#B91C1C] hover:bg-[#991B1B]"
              disabled={busy === "delete"}
              onClick={() => void handleDelete()}
            >
              {busy === "delete" ? "Lösche…" : "Löschen"}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[var(--text-secondary)]">
          „{vorgang.titel}“ wird dauerhaft aus HELPY entfernt.
        </p>
      </Modal>
    </>
  );
}
