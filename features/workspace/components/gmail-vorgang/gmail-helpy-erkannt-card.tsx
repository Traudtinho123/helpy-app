"use client";

import { Sparkles } from "lucide-react";
import { SectionCard, FieldGrid } from "@/features/workspace/components/workspace-sections";
import { useWorkspaceContext } from "@/features/workspace/context";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";

export function GmailHelpyErkanntCard() {
  const { vorgang, listeVorgang, mail, recommendation, currentWorkflow } =
    useWorkspaceContext();
  const skillConfig = getSkillConfig(vorgang.skill);
  const isArchive = currentWorkflow.isArchive;

  const intentLabel =
    mail.intentLabel ??
    vorgang.kopfzeile?.intentLabel ??
    vorgang.aufgabe.kategorie;

  const prioritaet =
    listeVorgang?.prioritaet
      ? listeVorgang.prioritaet.charAt(0).toUpperCase() +
        listeVorgang.prioritaet.slice(1)
      : vorgang.kopfzeile?.prioritaetLabel ?? "Mittel";

  const zusammenfassung =
    mail.summary ??
    mail.zusammenfassung ??
    vorgang.helpy.erkannt ??
    "—";

  const empfehlung = isArchive
    ? vorgang.helpy.empfehlung
    : recommendation?.decisionTitle ?? vorgang.helpy.empfehlung;

  return (
    <SectionCard title="HELPY erkennt" icon={Sparkles}>
      <div className="space-y-4">
        <FieldGrid
          fields={[
            { label: "Bereich", value: listeVorgang?.skillLabel ?? skillConfig.label, highlight: true },
            { label: "Anliegen", value: intentLabel },
            { label: "Priorität", value: prioritaet },
          ]}
        />

        <div className="rounded-[14px] border border-[var(--border-accent)]/50 bg-[var(--accent-light)]/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--accent)] uppercase">
            Zusammenfassung
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {zusammenfassung}
          </p>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
            Empfehlung
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-[var(--text-primary)]">
            {empfehlung}
          </p>
          {!isArchive && recommendation?.reason && (
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
              {recommendation.reason}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
