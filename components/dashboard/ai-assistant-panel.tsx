import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety";

const suggestions = [
  "Posteingang zusammenfassen",
  "Angebotsantwort entwerfen",
  "Kalender für heute anzeigen",
];

export function AiAssistantPanel() {
  return (
    <HelpyPanelShell variant="sidebar" showOnlineBadge>
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pt-2">
        <div className="helpy-fade-in-slide flex gap-3.5">
          <HelpyAvatar size="sm" pose="typing" />
          <div className="min-w-0 flex-1">
            <p className="helpy-label mb-2 normal-case tracking-normal">
              HELPY · Gerade eben
            </p>
            <div className="helpy-chat-bubble rounded-[20px] rounded-tl-[8px] px-5 py-4">
              <p className="text-[13px] leading-[1.65] font-medium text-[var(--text-primary)]">
                Guten Morgen!
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

      <div className="mt-5 space-y-4 px-1">
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
    </HelpyPanelShell>
  );
}
