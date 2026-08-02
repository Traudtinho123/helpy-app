"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchMatches,
  getMatchesForObject,
  markMatchKontaktiert,
  subscribeMatchingStore,
} from "@/features/matching/services/match-client-store";
import { buildMatchMailDraft } from "@/features/matching/services/match-mail-template";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import { cn } from "@/lib/utils";

type ObjectMatchesTabProps = {
  objectId: string;
};

export function ObjectMatchesTab({ objectId }: ObjectMatchesTabProps) {
  const [revision, setRevision] = useState(0);
  const [expandedMail, setExpandedMail] = useState<string | null>(null);

  useEffect(() => subscribeMatchingStore(() => setRevision((r) => r + 1)), []);
  useEffect(() => {
    void fetchMatches({ objekt_id: objectId });
  }, [objectId]);

  const matches = useMemo(
    () => getMatchesForObject(objectId),
    [objectId, revision]
  );
  const object = useMemo(() => getRealEstateObjectById(objectId), [objectId]);

  if (!matches.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-12 text-center">
        <Users className="mx-auto size-8 text-[var(--text-muted)]" strokeWidth={1.5} />
        <p className="mt-3 text-[14px] font-medium text-[var(--text-secondary)]">
          Noch keine passenden Interessenten
        </p>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          HELPY prüft aktive Suchprofile automatisch bei neuen Objekten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
            Passende Interessenten
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {matches.length} Match{matches.length === 1 ? "" : "es"} ≥ 70%
          </p>
        </div>
        <Link
          href={`mailto:${matches.map((m) => m.kunde_email).filter(Boolean).join(",")}?subject=${encodeURIComponent(`Passende Objekte: ${object?.titel ?? ""}`)}`}
          className="inline-flex h-9 items-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-light)]/40"
        >
          Alle kontaktieren
        </Link>
      </div>

      <ul className="space-y-3">
        {matches.map((match) => {
          const mailDraft =
            object && match.kunde_name
              ? buildMatchMailDraft({
                  object,
                  kundeName: match.kunde_name,
                })
              : null;

          return (
            <li
              key={match.id}
              className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {match.kunde_name ?? "Interessent"}
                    </p>
                    <ScoreBadge score={match.score} />
                    {match.kontaktiert && (
                      <Badge className="rounded-full bg-[#ECFDF5] text-[10px] text-[#047857]">
                        Kontaktiert
                      </Badge>
                    )}
                  </div>
                  {match.kunde_email && (
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                      {match.kunde_email}
                    </p>
                  )}
                  <ScoreBreakdown details={match.score_details} />
                </div>

                <div className="flex shrink-0 gap-2">
                  {mailDraft && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setExpandedMail(
                          expandedMail === match.id ? null : match.id
                        )
                      }
                      className="h-8 rounded-[10px] px-3 text-[11px]"
                    >
                      <Mail className="mr-1 size-3" />
                      Mail vorbereiten
                    </Button>
                  )}
                  {match.kunde_telefon && (
                    <a
                      href={`tel:${match.kunde_telefon}`}
                      onClick={() => markMatchKontaktiert(match.id)}
                      className="inline-flex h-8 items-center rounded-[10px] border border-[var(--border)] px-3 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                    >
                      <Phone className="mr-1 size-3" />
                      Anrufen
                    </a>
                  )}
                </div>
              </div>

              {expandedMail === match.id && mailDraft && (
                <div className="mt-3 rounded-[12px] border border-[var(--border-accent)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                    Betreff
                  </p>
                  <p className="text-[12px] font-medium text-[var(--text-primary)]">
                    {mailDraft.subject}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                    Entwurf
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {mailDraft.body}
                  </pre>
                  <a
                    href={`mailto:${match.kunde_email}?subject=${encodeURIComponent(mailDraft.subject)}&body=${encodeURIComponent(mailDraft.body)}`}
                    onClick={() => markMatchKontaktiert(match.id)}
                    className="mt-3 inline-flex h-8 items-center rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white"
                  >
                    In Mail-App öffnen
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold",
        score >= 85
          ? "bg-[#ECFDF5] text-[#047857]"
          : score >= 70
            ? "bg-[var(--accent-light)] text-[var(--accent)]"
            : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
      )}
    >
      {score}%
    </span>
  );
}

function ScoreBreakdown({
  details,
}: {
  details: {
    preis: number;
    zimmer: number;
    lage: number;
    objekttyp: number;
    muss_kriterien: number;
  };
}) {
  const parts = [
    details.preis > 0 && `Preis +${details.preis}%`,
    details.zimmer > 0 && `Zimmer +${details.zimmer}%`,
    details.lage > 0 && `Lage +${details.lage}%`,
    details.objekttyp > 0 && `Typ +${details.objekttyp}%`,
    details.muss_kriterien > 0 && `Kriterien +${details.muss_kriterien}%`,
  ].filter(Boolean);

  if (!parts.length) return null;

  return (
    <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">{parts.join(" · ")}</p>
  );
}
