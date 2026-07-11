"use client";

import { useMemo } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { BrainV2Summary } from "@/features/brain/services/brain-v2";
import { isVorgangActiveOpen } from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import {
  getGmailAutoSyncServerSnapshot,
  getGmailAutoSyncState,
  subscribeGmailAutoSyncPanel,
} from "@/features/gmail/services/gmail-auto-sync";
import { STATUS_PANEL_MESSAGE } from "@/features/workspace/services/status";
import {
  buildVorgaengeCentralSummary,
  subscribeVorgaengeCounts,
} from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import { sortDeduplicatedVorgaenge } from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { useTerminology } from "@/features/workspace/services/terminology";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

type HelpyVorgaengePanelProps = {
  allVorgaenge: Vorgang[];
  summary: BrainV2Summary;
  useMailSource?: boolean;
  panelMessage?: string | null;
};

const MAIL_INTRO_MESSAGE =
  "Ich habe deine E-Mails geprüft und daraus vorbereitete Vorgänge erstellt.";

export function HelpyVorgaengePanel({
  allVorgaenge,
  summary,
  useMailSource = false,
  panelMessage = null,
}: HelpyVorgaengePanelProps) {
  const { t } = useTerminology();
  const countsRevision = useStoreRevision(subscribeVorgaengeCounts);
  const autoSyncState = useExternalStore(
    subscribeGmailAutoSyncPanel,
    getGmailAutoSyncState,
    getGmailAutoSyncServerSnapshot
  );

  const centralSummary = useMemo(
    () => buildVorgaengeCentralSummary(allVorgaenge),
    [allVorgaenge, countsRevision]
  );
  const statusSummary = centralSummary.dailyStatus;

  const neueKundenCount = useMemo(() => {
    if (useMailSource) {
      return allVorgaenge.filter(
        (item) =>
          isVorgangActiveOpen(item) &&
          (item.typ === "neuer_kunde" || item.typ === "anfrage")
      ).length;
    }
    return summary.neueKunden;
  }, [allVorgaenge, countsRevision, summary.neueKunden, useMailSource]);

  const helpySays = useMemo(() => {
    if (panelMessage) return panelMessage;
    if (useMailSource && autoSyncState.panelMessage) {
      return autoSyncState.panelMessage;
    }
    if (useMailSource) return MAIL_INTRO_MESSAGE;
    return summary.introMessage || STATUS_PANEL_MESSAGE;
  }, [
    autoSyncState.panelMessage,
    panelMessage,
    summary.introMessage,
    useMailSource,
  ]);

  const recommendations = useMemo(() => {
    const active = allVorgaenge.filter(isVorgangActiveOpen);
    return sortDeduplicatedVorgaenge(active)
      .filter((item) => item.helpyEmpfehlung.trim().length > 0)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        titel: item.titel,
        text: item.helpyEmpfehlung,
      }));
  }, [allVorgaenge, countsRevision]);

  return (
    <Panel variant="helpy">
      <PanelHeader className="h-auto items-start py-5">
        <div className="flex items-center gap-3">
          <HelpyAvatar />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              HELPY
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              Dein KI-Bürokollege
            </p>
          </div>
        </div>
      </PanelHeader>

      <PanelBody>
        <div className="space-y-5">
          <Card className="helpy-fade-in rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm backdrop-blur-sm">
            <CardContent className="p-5">
              <p className="text-[12px] font-semibold text-[#0F172A]">Heute</p>
              <ul className="mt-3 space-y-2.5">
                <li className="flex items-center justify-between text-[12px] text-[#334155]">
                  <span>Vorgänge vorbereitet</span>
                  <span className="font-semibold text-[#2563EB]">
                    {statusSummary.vorbereitet}
                  </span>
                </li>
                <li className="flex items-center justify-between text-[12px] text-[#334155]">
                  <span>Warten auf Prüfung</span>
                  <span className="font-semibold text-[#B45309]">
                    {statusSummary.wartenAufPruefung}
                  </span>
                </li>
                <li className="flex items-center justify-between text-[12px] text-[#334155]">
                  <span>Bestätigt</span>
                  <span className="font-semibold text-[#047857]">
                    {statusSummary.bestaetigt}
                  </span>
                </li>
                <li className="flex items-center justify-between text-[12px] text-[#334155]">
                  <span>Erledigt</span>
                  <span className="font-semibold text-[#64748B]">
                    {statusSummary.erledigt}
                  </span>
                </li>
                <li className="flex items-center justify-between text-[12px] text-[#334155]">
                  <span>{t("customerNew", { form: "plural" })}</span>
                  <span className="font-semibold text-[#2563EB]">
                    {neueKundenCount}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="helpy-fade-in rounded-[20px] border-[#BFDBFE]/40 bg-gradient-to-br from-[#EFF6FF]/60 to-white/90 py-0 shadow-sm backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  HELPY sagt
                </p>
              </div>
              <p className="mt-3 text-[12px] leading-[1.65] text-[#334155]">
                {helpySays}
              </p>
            </CardContent>
          </Card>

          <Card className="helpy-fade-in rounded-[20px] border-[#FDE68A]/40 bg-gradient-to-br from-[#FFFBEB]/50 to-white/90 py-0 shadow-sm backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  Empfehlungen
                </p>
              </div>
              {recommendations.length === 0 ? (
                <p className="mt-3 text-[12px] leading-[1.65] text-[#64748B]">
                  Sobald Vorgänge vorbereitet sind, zeige ich dir hier die
                  wichtigsten nächsten Schritte.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {recommendations.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[14px] border border-[#FDE68A]/40 bg-white/70 px-3.5 py-3"
                    >
                      <p className="text-[11px] font-semibold text-[#92400E]">
                        {item.titel}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-[1.65] text-[#334155]">
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </PanelBody>
    </Panel>
  );
}
