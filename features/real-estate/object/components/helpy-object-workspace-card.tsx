"use client";

import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { FieldGrid } from "@/features/workspace/components/workspace-sections";
import { useWorkspaceContext } from "@/features/workspace/context";
import { getObjektPathFromVorgang } from "@/features/workspace/services/navigation/entity-navigation";
import {
  openObjektPanel,
  openWorkspacePanelWithFallback,
} from "@/features/workspace/panels/workspace-panel-openers";
import {
  HELPY_BUTTON_OBJEKT_OEFFNEN,
  HELPY_OBJECT_CARD_HINT,
  HELPY_OBJECT_CARD_TITLE,
} from "@/features/real-estate/object/object-service";

export function HelpyObjectWorkspaceCard() {
  const router = useRouter();
  const { workspaceId, object } = useWorkspaceContext();

  const handleOpen = useCallback(() => {
    const result = openObjektPanel({ vorgangId: workspaceId });
    if (!result.opened) {
      if (result.fallbackHref) {
        openWorkspacePanelWithFallback(result, (href) => router.push(href));
        return;
      }
      if (object?.objectId) {
        router.push(getObjektPathFromVorgang(object.objectId, workspaceId));
        return;
      }
      document.getElementById("workspace-objekt")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [object?.objectId, router, workspaceId]);

  if (!object || object.source !== "object-memory") return null;

  return (
    <div className="rounded-[16px] border border-[#BFDBFE]/60 bg-gradient-to-br from-[#EFF6FF]/70 to-white/90 px-4 py-3.5 shadow-[0_2px_12px_rgba(37,99,235,0.06)]">
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-[#2563EB]" strokeWidth={2} />
        <p className="text-[12px] font-semibold text-[#0F172A]">
          {HELPY_OBJECT_CARD_TITLE}
        </p>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
        {HELPY_OBJECT_CARD_HINT}
      </p>

      <div className="mt-3 rounded-[12px] border border-[#BFDBFE]/50 bg-white/80 px-3.5 py-3">
        <FieldGrid
          fields={[
            { label: "Titel", value: object.titel, highlight: true },
            { label: "Adresse", value: object.adresse },
            { label: "Quelle", value: object.quelle },
            object.preis ? { label: "Preis", value: object.preis } : null,
          ].filter(
            (field): field is { label: string; value: string; highlight?: boolean } =>
              field !== null
          )}
        />
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[12px] bg-[#2563EB] text-[12px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
      >
        {HELPY_BUTTON_OBJEKT_OEFFNEN}
      </button>
    </div>
  );
}
