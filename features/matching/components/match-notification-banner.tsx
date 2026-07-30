"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  getMatchesForObject,
  subscribeMatchingStore,
} from "@/features/matching/services/match-client-store";

type MatchNotificationBannerProps = {
  objectId: string;
  objectTitle: string;
};

export function MatchNotificationBanner({
  objectId,
  objectTitle,
}: MatchNotificationBannerProps) {
  const [revision, setRevision] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => subscribeMatchingStore(() => setRevision((r) => r + 1)), []);

  const matches = useMemo(
    () => getMatchesForObject(objectId),
    [objectId, revision]
  );

  if (dismissed || !matches.length) return null;

  const count = matches.length;
  const names = matches
    .map((m) => m.kunde_name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return (
    <div className="mb-5 rounded-[16px] border border-[#BBF7D0]/60 bg-gradient-to-r from-[#F0FDF4]/90 to-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-[#0F172A]">
            🏠 Neues Objekt: Match für {count} Interessent
            {count === 1 ? "en" : "en"}!
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            {objectTitle}
            {names ? ` — ${names}${count > 3 ? "…" : ""}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/objekte/${encodeURIComponent(objectId)}?tab=matches`}
              className="inline-flex h-8 items-center rounded-[10px] bg-[#16A34A] px-3 text-[11px] font-semibold text-white hover:bg-[#15803D]"
            >
              Alle kontaktieren
            </Link>
            <Link
              href={`/objekte/${encodeURIComponent(objectId)}?tab=matches`}
              className="inline-flex h-8 items-center rounded-[10px] border border-[#CBD5E1]/60 px-3 text-[11px] font-medium text-[#334155] hover:bg-[#F8FAFC]"
            >
              Einzeln prüfen
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-[8px] p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#64748B]"
          aria-label="Schliessen"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
