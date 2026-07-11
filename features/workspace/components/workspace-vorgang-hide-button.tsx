"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
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
        className="h-8 rounded-[10px] px-2.5 text-[11px] font-medium text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#64748B]"
      >
        <EyeOff className="mr-1.5 size-3.5" />
        Vorgang ausblenden
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC]/80 px-2.5 py-1.5">
      <span className="text-[11px] text-[#64748B]">Vorgang wirklich ausblenden?</span>
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
        {hiding ? "…" : "Ausblenden"}
      </Button>
    </div>
  );
}
