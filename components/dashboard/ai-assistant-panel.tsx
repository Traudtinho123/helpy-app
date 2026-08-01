"use client";

import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { HelpyChatComposer } from "@/features/helpy-chat/components/helpy-chat-composer";
import { HelpyChatThread } from "@/features/helpy-chat/components/helpy-chat-thread";
import { useHelpyChat } from "@/features/helpy-chat/hooks/use-helpy-chat";
import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety";

const suggestions = [
  "Posteingang zusammenfassen",
  "Angebotsantwort entwerfen",
  "Kalender für heute anzeigen",
];

export function AiAssistantPanel() {
  const { messages, isSending, error, sendMessage } = useHelpyChat({
    context: { surface: "dashboard" },
  });

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

        <HelpyChatThread
          messages={messages}
          isSending={isSending}
          error={error}
        />
      </div>

      <div className="mt-5 px-1">
        <HelpyChatComposer
          onSend={sendMessage}
          isSending={isSending}
          suggestions={suggestions}
          placeholder="Frag HELPY…"
          variant="glass"
        />
      </div>
    </HelpyPanelShell>
  );
}
