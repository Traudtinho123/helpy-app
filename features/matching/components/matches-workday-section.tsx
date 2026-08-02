"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import {
  fetchMatches,
  getTodayMatches,
  subscribeMatchingStore,
} from "@/features/matching/services/match-client-store";

export function MatchesWorkdaySection() {
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeMatchingStore(() => setRevision((r) => r + 1)), []);
  useEffect(() => {
    void fetchMatches({ today: true });
  }, []);

  const matches = useMemo(() => getTodayMatches(), [revision]);
  const grouped = useMemo(() => {
    const byObject = new Map<
      string,
      { objectId: string; count: number; topScore: number; kunden: string[] }
    >();

    for (const match of matches) {
      const existing = byObject.get(match.objekt_id);
      if (existing) {
        existing.count += 1;
        existing.topScore = Math.max(existing.topScore, match.score);
        if (match.kunde_name) existing.kunden.push(match.kunde_name);
      } else {
        byObject.set(match.objekt_id, {
          objectId: match.objekt_id,
          count: 1,
          topScore: match.score,
          kunden: match.kunde_name ? [match.kunde_name] : [],
        });
      }
    }

    return [...byObject.values()].sort((a, b) => b.topScore - a.topScore);
  }, [matches]);

  if (!grouped.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#F0FDF4]">
          <Link2 className="size-5 text-[#16A34A]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[1.2rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            🔗 Neue Matches heute
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            {matches.length} Interessenten-Matches für {grouped.length} Objekt
            {grouped.length === 1 ? "" : "e"}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {grouped.map((group) => (
          <li
            key={group.objectId}
            className="rounded-[20px] border border-[#BBF7D0]/50 bg-[var(--bg-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  🏠 Match für {group.count} Interessent
                  {group.count === 1 ? "en" : "en"}
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  Top-Score {group.topScore}%
                  {group.kunden.length
                    ? ` · ${group.kunden.slice(0, 3).join(", ")}${group.kunden.length > 3 ? "…" : ""}`
                    : ""}
                </p>
              </div>
              <Link
                href={`/objekte/${encodeURIComponent(group.objectId)}?tab=matches`}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 text-[12px] font-medium text-[var(--text-secondary)] transition-all hover:border-[#BBF7D0]/60 hover:bg-[#F0FDF4]/40"
              >
                Einzeln prüfen
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
