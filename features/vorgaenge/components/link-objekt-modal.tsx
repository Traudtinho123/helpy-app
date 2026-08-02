"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { ensurePortfolioSeed } from "@/features/portfolio/services/portfolio-service";
import { getAllRealEstateObjects } from "@/features/real-estate/object/object-memory";
import {
  linkRealEstateObjectToVorgang,
  patchVorgangLinks,
} from "@/features/vorgaenge/services/vorgang-link-service";
import { createDealFromVorgang } from "@/features/deals/services/deal-client-store";

type LinkObjektModalProps = {
  open: boolean;
  onClose: () => void;
  vorgangId: string;
  kundeId?: string | null;
  onLinked: (objectId: string) => void;
};

export function LinkObjektModal({
  open,
  onClose,
  vorgangId,
  kundeId,
  onLinked,
}: LinkObjektModalProps) {
  const [query, setQuery] = useState("");

  const objects = useMemo(() => {
    ensurePortfolioSeed();
    return getAllRealEstateObjects().filter((object) => object.aktiv);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return objects.slice(0, 5);
    return objects
      .filter(
        (object) =>
          object.titel.toLowerCase().includes(q) ||
          object.adresse.toLowerCase().includes(q) ||
          object.ort.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [objects, query]);

  const handleSelect = async (objectId: string) => {
    linkRealEstateObjectToVorgang(objectId, vorgangId);
    await patchVorgangLinks({ vorgangId, objektId: objectId });

    if (kundeId) {
      void createDealFromVorgang({
        vorgangId,
        objektId: objectId,
        kundeId,
      });
    }

    onLinked(objectId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Objekt verknüpfen">
      <div className="space-y-3 p-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Objekt suchen…"
            className="pl-9"
          />
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-[13px] text-[#64748B]">Keine Objekte gefunden.</p>
          ) : (
            filtered.map((object) => (
              <button
                key={object.objectId}
                type="button"
                onClick={() => void handleSelect(object.objectId)}
                className="flex w-full flex-col rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-[#F8FAFC]"
              >
                <span className="text-[14px] font-medium text-[#0F172A]">{object.titel}</span>
                <span className="text-[12px] text-[#64748B]">
                  {object.adresse}, {object.ort}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
