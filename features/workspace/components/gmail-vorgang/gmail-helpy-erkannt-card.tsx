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

        <div className="rounded-[14px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
            Zusammenfassung
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
            {zusammenfassung}
          </p>
        </div>

        <div className="rounded-[14px] border border-[#E2E8F0]/70 bg-white/90 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
            Empfehlung
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-[#0F172A]">
            {empfehlung}
          </p>
          {!isArchive && recommendation?.reason && (
            <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
              {recommendation.reason}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
