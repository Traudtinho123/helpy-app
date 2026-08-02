"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hideVorgang } from "@/features/workspace/services/vorgang-visibility-store";

type WorkspaceVorgangHideButtonProps = {
  vorgangId: string;
};

export function WorkspaceVorgangHideButton({
  vorgangId,
}: WorkspaceVorgangHideButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [hiding, setHiding] = useState(false);

  const handleHide = async () => {
    setHiding(true);
    hideVorgang(vorgangId);
    router.push("/vorgaenge");
  };

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setConfirming(true)}
        title="Vorgang aus der Liste ausblenden (bleibt in Gmail/Outlook)"
        className="h-8 rounded-[10px] px-2.5 text-[11px] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
      >
        <Archive className="mr-1.5 size-3.5" />
        Archivieren
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5">
      <span className="text-[11px] text-[var(--text-secondary)]">
        Vorgang aus der Liste entfernen? (Mail bleibt im Postfach)
      </span>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(false)}
        disabled={hiding}
        className="h-7 rounded-[8px] px-2.5 text-[10px] font-medium"
      >
        Abbrechen
      </Button>
      <Button
        type="button"
        onClick={() => void handleHide()}
        disabled={hiding}
        className="h-7 rounded-[8px] bg-[#64748B] px-2.5 text-[10px] font-semibold text-white hover:bg-[#475569]"
      >
        {hiding ? "…" : "Archivieren"}
      </Button>
    </div>
  );
}
