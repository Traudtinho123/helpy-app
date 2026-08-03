"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import {
  clearVorgangSelection,
  getSelectedVorgangIds,
  subscribeVorgaengeSelection,
  toggleSelectAllVorgangIds,
} from "@/features/workspace/services/vorgaenge/vorgaenge-selection-store";
import {
  deleteArchivedVorgaenge,
  restoreVorgaengeFromArchive,
} from "@/features/workspace/services/vorgaenge/vorgang-restore-service";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type VorgaengeArchiveBulkBarProps = {
  vorgaenge: Vorgang[];
  onChanged: (message: string) => void;
  className?: string;
};

export function VorgaengeArchiveBulkBar({
  vorgaenge,
  onChanged,
  className,
}: VorgaengeArchiveBulkBarProps) {
  const selectedIds = useExternalStore(
    subscribeVorgaengeSelection,
    getSelectedVorgangIds,
    getSelectedVorgangIds
  );
  const [loading, setLoading] = useState<"delete" | "restore" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const selectedVorgaenge = useMemo(
    () => vorgaenge.filter((item) => selectedIds.includes(item.id)),
    [selectedIds, vorgaenge]
  );

  if (selectedIds.length === 0) return null;

  const handleBulkRestore = async () => {
    setLoading("restore");
    const { count } = await restoreVorgaengeFromArchive(selectedVorgaenge);
    setLoading(null);
    clearVorgangSelection();
    if (count > 0) {
      onChanged(
        count === 1
          ? "1 Vorgang als echter Vorgang markiert."
          : `${count} Vorgänge als echte Vorgänge markiert.`
      );
    }
  };

  const handleBulkDelete = async () => {
    setLoading("delete");
    const { count } = await deleteArchivedVorgaenge(selectedVorgaenge);
    setLoading(null);
    setDeleteConfirmOpen(false);
    clearVorgangSelection();
    if (count > 0) {
      onChanged(
        count === 1
          ? "1 archivierte Mail gelöscht."
          : `${count} archivierte Mails gelöscht.`
      );
    }
  };

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)]/95 px-4 py-3 shadow-sm backdrop-blur-md",
          className
        )}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {selectedIds.length} ausgewählt
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => void handleBulkRestore()}
          className="h-8 gap-1.5 rounded-[10px] border-[var(--border)] text-[11px]"
        >
          <RotateCcw className="size-3.5" />
          {loading === "restore" ? "Verschiebe…" : "Als echte Vorgänge markieren"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => setDeleteConfirmOpen(true)}
          className="h-8 gap-1.5 rounded-[10px] border-[#FECACA] text-[11px] text-[#B91C1C] hover:text-[#B91C1C]"
        >
          <Trash2 className="size-3.5" />
          {loading === "delete" ? "Lösche…" : "Auswahl löschen"}
        </Button>
        <button
          type="button"
          onClick={clearVorgangSelection}
          className="ml-auto text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Auswahl aufheben
        </button>
      </div>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Auswahl sicher löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-[10px]"
              disabled={loading === "delete"}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#B91C1C] hover:bg-[#991B1B]"
              disabled={loading === "delete"}
              onClick={() => void handleBulkDelete()}
            >
              {loading === "delete"
                ? "Lösche…"
                : `${selectedVorgaenge.length} löschen`}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[var(--text-secondary)]">
          {selectedVorgaenge.length === 1
            ? "1 archivierte Mail wird dauerhaft aus HELPY entfernt."
            : `${selectedVorgaenge.length} archivierte Mails werden dauerhaft aus HELPY entfernt.`}
        </p>
      </Modal>
    </>
  );
}

type ArchiveSelectAllProps = {
  vorgaenge: Vorgang[];
  className?: string;
};

export function ArchiveSelectAllControl({
  vorgaenge,
  className,
}: ArchiveSelectAllProps) {
  const selectedIds = useExternalStore(
    subscribeVorgaengeSelection,
    getSelectedVorgangIds,
    getSelectedVorgangIds
  );

  const ids = useMemo(() => vorgaenge.map((item) => item.id), [vorgaenge]);
  const allSelected =
    ids.length > 0 && ids.every((id) => selectedIds.includes(id));
  const someSelected =
    !allSelected && ids.some((id) => selectedIds.includes(id));

  if (ids.length === 0) return null;

  return (
    <label
      className={cn(
        "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded border border-[var(--border-strong)] bg-[var(--bg-surface)]",
          allSelected && "border-[var(--accent)] bg-[var(--accent-light)]",
          someSelected && !allSelected && "border-[var(--accent)]"
        )}
      >
        <input
          type="checkbox"
          checked={allSelected}
          className="sr-only"
          onChange={() => toggleSelectAllVorgangIds(ids)}
        />
        {allSelected ? (
          <Check className="size-3 text-[var(--accent)]" strokeWidth={3} />
        ) : someSelected ? (
          <span className="block size-2 rounded-sm bg-[var(--accent)]" />
        ) : null}
      </span>
      {allSelected ? "Alle abwählen" : "Alle auswählen"}
    </label>
  );
}
