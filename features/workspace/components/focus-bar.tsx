"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { UserMenu } from "@/components/user-menu/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeVorgang } from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import { getGmailListeVorgang } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { displayName } from "@/lib/format/display";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type FocusBarProps = {
  vorgang: Vorgang;
};

const priorityStyles = {
  Kritisch: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
  Hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  Mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  Niedrig: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
} as const;

export function FocusBar({ vorgang }: FocusBarProps) {
  const { kunde, kopfzeile } = vorgang;
  const skillConfig = getSkillConfig(vorgang.skill);
  const prioritaet = kopfzeile?.prioritaetLabel ?? "Mittel";
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    const listeVorgang = getGmailListeVorgang(vorgang.id);
    if (!listeVorgang) return;

    setCompleting(true);
    const supabase = createClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    await completeVorgang(listeVorgang, session?.provider_token);
    setCompleting(false);
  };

  return (
    <div className="relative z-30 shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)]/85 px-6 py-4 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="h-6 rounded-full border-0 bg-[#0F172A] px-3 text-[10px] font-semibold tracking-wide text-white uppercase">
              Aktueller Vorgang
            </Badge>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Kunde
              </p>
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {displayName(kunde.firmenname)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Skill
              </p>
              <p className="truncate text-[13px] font-semibold text-[var(--accent)]">
                {skillConfig.label}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Status
              </p>
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {kopfzeile?.statusLabel ?? "Von HELPY vorbereitet"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Priorität
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "mt-0.5 h-6 rounded-full px-2.5 text-[10px] font-semibold",
                  priorityStyles[prioritaet as keyof typeof priorityStyles] ??
                    priorityStyles.Mittel
                )}
              >
                {prioritaet}
              </Badge>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Quelle
              </p>
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {kopfzeile?.quelle ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={completing}
            onClick={() => void handleComplete()}
            className="h-9 gap-2 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] text-[12px] font-medium"
          >
            <CheckCircle2 className="size-3.5" />
            {completing ? "Wird markiert…" : "Als erledigt markieren"}
          </Button>
          <Link
            href="/vorgaenge"
            className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 text-[12px] font-medium text-[var(--text-secondary)] transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]/40"
          >
            <ArrowLeft className="size-3.5" />
            Zurück zu Vorgängen
          </Link>
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
