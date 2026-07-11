"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { HelpyAppointmentSuggestionWorkspaceCard } from "@/features/appointment-suggestions/components/helpy-appointment-suggestion-workspace-card";
import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import { FieldGrid, SectionCard } from "@/features/workspace/components/workspace-sections";
import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import { getGmailListeVorgang } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { getWorkspacePath, getWorkspaceVorgang } from "@/features/workspace/services/workspace";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";

type KalenderVorgangFocusPanelProps = {
  vorgangId: string;
  focus: string;
};

function readContextValue(
  lines: string[] | undefined,
  prefix: string
): string | null {
  if (!lines) return null;
  const line = lines.find((entry) => entry.startsWith(`${prefix}:`));
  if (!line) return null;
  const value = line.slice(prefix.length + 1).trim();
  return value && value !== PLATFORM_INQUIRY_MISSING ? value : null;
}

function resolveListeVorgang(vorgangId: string): ListeVorgang | null {
  return (
    getGmailListeVorgang(vorgangId) ??
    getBrainV2Vorgaenge().find((item) => item.id === vorgangId) ??
    null
  );
}

export function KalenderVorgangFocusPanel({
  vorgangId,
  focus,
}: KalenderVorgangFocusPanelProps) {
  const workspace = useMemo(() => getWorkspaceVorgang(vorgangId), [vorgangId]);
  const listeVorgang = useMemo(() => resolveListeVorgang(vorgangId), [vorgangId]);

  if (!workspace) return null;

  const interessent = listeVorgang?.kunde ?? workspace.kunde.ansprechpartner;
  const objekt =
    readContextValue(listeVorgang?.detectedContext, "Objekt") ??
    workspace.kunde.adresse ??
    "Bitte ergänzen";
  const gewuenschterTermin =
    readContextValue(listeVorgang?.detectedContext, "Besichtigung") ??
    "Bitte ergänzen";

  const title =
    focus === "besichtigung" ? "Besichtigung prüfen" : "Termin prüfen";

  return (
    <div className="border-b border-[#BFDBFE]/40 bg-gradient-to-br from-[#EFF6FF]/60 to-white/90 px-5 py-5 backdrop-blur-sm lg:px-8">
      <Link
        href={getWorkspacePath(vorgangId)}
        className="mb-4 inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#2563EB]"
      >
        <ArrowLeft className="size-3.5" />
        Zurück zum Vorgang
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <SectionCard title={title} icon={CalendarDays}>
          <FieldGrid
            fields={[
              { label: "Interessent", value: interessent },
              { label: "Objekt", value: objekt },
              { label: "Gewünschter Termin", value: gewuenschterTermin, highlight: true },
              {
                label: "Kalenderquelle",
                value: "Apple Kalender / Google Kalender",
              },
            ]}
          />
        </SectionCard>

        <HelpyAppointmentSuggestionWorkspaceCard
          vorgang={workspace}
          listeVorgang={listeVorgang ?? undefined}
        />
      </div>
    </div>
  );
}
