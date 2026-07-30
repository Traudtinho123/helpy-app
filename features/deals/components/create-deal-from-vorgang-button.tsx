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
  className?: string;
  onCreated?: () => void;
};

export function CreateDealFromVorgangButton({
  vorgangId,
  kundeId,
  dealType = "verkauf",
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
