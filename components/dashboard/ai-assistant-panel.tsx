import { ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety";

const suggestions = [
  "Posteingang zusammenfassen",
  "Angebotsantwort entwerfen",
  "Kalender für heute anzeigen",
];

export function AiAssistantPanel() {
  return (
    <Panel variant="sidebar">
      <PanelHeader className="px-7">
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
        <Badge
          variant="outline"
          className="h-6 rounded-full border-[#A7F3D0] bg-[#ECFDF5] px-2.5 text-[10px] font-semibold text-[#047857]"
        >
          Online
        </Badge>
      </PanelHeader>

      <PanelBody className="overflow-y-visible py-0 pb-5">
        <div className="flex-1 space-y-6 overflow-y-auto px-1 pt-4">
          <div className="flex gap-3.5">
            <HelpyAvatar size="sm" />
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold text-[#64748B]">
                HELPY · Gerade eben
              </p>
              <div className="rounded-[20px] rounded-tl-[8px] border border-[#CBD5E1]/50 bg-[#F8FAFC] px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                <p className="text-[13px] leading-[1.65] font-medium text-[#0F172A]">
                  Guten Morgen, Martina!
                </p>
                <p className="mt-2.5 text-[13px] leading-[1.65] text-[#334155]">
                  Du hast{" "}
                  <span className="font-semibold text-[#0F172A]">
                    1 dringendes Angebot
                  </span>
                  ,{" "}
                  <span className="font-semibold text-[#0F172A]">
                    2 Kalendertermine
                  </span>{" "}
                  und{" "}
                  <span className="font-semibold text-[#0F172A]">3 E-Mails</span>,
                  die heute deine Aufmerksamkeit brauchen.
                </p>
                <p className="mt-3 text-[13px] leading-[1.65] text-[#64748B]">
                  {HELPY_PANEL_REVIEW_INTRO}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2 px-0.5">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-[#CBD5E1]/60 bg-white px-3.5 text-[11px] font-medium text-[#475569] shadow-sm transition-all duration-300 hover:border-[#2563EB]/30 hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:shadow-md"
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <div className="rounded-[24px] border border-[#CBD5E1]/50 bg-white p-2.5 shadow-[0_4px_32px_rgba(15,23,42,0.08)] transition-all duration-300 focus-within:border-[#2563EB]/30 focus-within:shadow-[0_8px_40px_rgba(37,99,235,0.12)]">
            <textarea
              rows={2}
              placeholder="Frag HELPY…"
              className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-[10px] font-medium text-[#94A3B8]">
                Eingabe zum Senden
              </p>
              <Button
                size="icon-sm"
                className="size-8 rounded-[12px] bg-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_4px_16px_rgba(37,99,235,0.45)]"
                aria-label="Nachricht senden"
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}
