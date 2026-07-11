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

function OnlineBadge() {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-light)] px-2.5 text-[10px] font-semibold text-[var(--success)]"
    >
      <span
        aria-hidden
        className="helpy-online-pulse size-1.5 rounded-full bg-[var(--success)]"
      />
      Online
    </Badge>
  );
}

export function AiAssistantPanel() {
  return (
    <Panel variant="sidebar">
      <PanelHeader className="px-7">
        <div className="flex items-center gap-3">
          <HelpyAvatar size="lg" />
          <div>
            <h2 className="helpy-h2 text-sm">HELPY</h2>
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
              Dein KI-Bürokollege
            </p>
          </div>
        </div>
        <OnlineBadge />
      </PanelHeader>

      <PanelBody className="overflow-y-visible py-0 pb-5">
        <div className="flex-1 space-y-6 overflow-y-auto px-1 pt-4">
          <div className="helpy-fade-in-slide flex gap-3.5">
            <HelpyAvatar size="sm" />
            <div className="min-w-0 flex-1">
              <p className="helpy-label mb-2 normal-case tracking-normal">
                HELPY · Gerade eben
              </p>
              <div className="helpy-chat-bubble rounded-[20px] rounded-tl-[8px] px-5 py-4">
                <p className="text-[13px] leading-[1.65] font-medium text-[var(--text-primary)]">
                  Guten Morgen, Martina!
                </p>
                <p className="mt-2.5 text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                  Du hast{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    1 dringendes Angebot
                  </span>
                  ,{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    2 Kalendertermine
                  </span>{" "}
                  und{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    3 E-Mails
                  </span>
                  , die heute deine Aufmerksamkeit brauchen.
                </p>
                <p className="mt-3 text-[13px] leading-[1.65] text-[var(--text-muted)]">
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
                variant="secondary"
                size="sm"
                className="h-8 rounded-full px-3.5 text-[11px] font-medium"
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <div className="helpy-glass-card rounded-[20px] p-2.5 transition-all duration-200 focus-within:shadow-[var(--button-primary-shadow)]">
            <textarea
              rows={2}
              placeholder="Frag HELPY…"
              className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-[10px] font-medium text-[var(--text-muted)]">
                Eingabe zum Senden
              </p>
              <Button
                size="icon-sm"
                variant="primary"
                className="size-8 rounded-[8px]"
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
