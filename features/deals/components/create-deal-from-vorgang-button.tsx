"use client";

import { useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDealFromVorgang } from "@/features/deals/services/deal-client-store";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";

type CreateDealFromVorgangButtonProps = {
  vorgangId: string;
  kundeId?: string | null;
  dealType?: "verkauf" | "vermietung";
  display?: "button" | "icon" | "inline";
  className?: string;
  onCreated?: () => void;
};

export function CreateDealFromVorgangButton({
  vorgangId,
  kundeId,
  dealType = "verkauf",
  display = "button",
  className,
  onCreated,
}: CreateDealFromVorgangButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    const objekt = peekRealEstateObjectByVorgangId(vorgangId);
    if (!objekt) {
      window.alert(
        "Bitte zuerst ein Objekt mit diesem Vorgang verknüpfen (Workspace oder Objekte)."
      );
      return;
    }

    setLoading(true);
    const deal = await createDealFromVorgang({
      vorgangId,
      objektId: objekt.objectId,
      kundeId,
      dealType,
    });
    setLoading(false);

    if (deal) {
      setDone(true);
      onCreated?.();
    }
  };

  if (display === "icon") {
    return (
      <button
        type="button"
        title={done ? "In Pipeline" : "Deal anlegen"}
        disabled={loading || done}
        className={
          className ??
          "flex size-8 items-center justify-center rounded-[10px] border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] transition-colors hover:bg-[#EDE9FE] disabled:opacity-60"
        }
        onClick={() => void handleClick()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GitBranch className="size-4" />
        )}
      </button>
    );
  }

  if (display === "inline") {
    return (
      <button
        type="button"
        disabled={loading || done}
        className={
          className ??
          "inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7C3AED] hover:underline disabled:opacity-60"
        }
        onClick={() => void handleClick()}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <GitBranch className="size-3.5" />
        )}
        {done ? "In Pipeline" : "Deal anlegen"}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={done ? "secondary" : "primary"}
      size="sm"
      disabled={loading || done}
      className={className}
      onClick={() => void handleClick()}
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Wird angelegt…
        </>
      ) : done ? (
        <>
          <GitBranch className="size-3.5" />
          In Pipeline
        </>
      ) : (
        <>
          <GitBranch className="size-3.5" />
          Deal anlegen
        </>
      )}
    </Button>
  );
}
