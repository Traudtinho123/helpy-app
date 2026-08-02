"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { WhatsappIcon } from "@/features/whatsapp/components/whatsapp-icon";
import type { WhatsappMessage } from "@/features/whatsapp/types/whatsapp-types";
import { WHATSAPP_BRAND_COLOR } from "@/features/whatsapp/types/whatsapp-types";
import { cn } from "@/lib/utils";

type WhatsappHelpyPanelProps = {
  messages: WhatsappMessage[];
  selectedMessage: WhatsappMessage | null;
};

function formatWaitHint(receivedAt: string): string | null {
  const received = new Date(receivedAt).getTime();
  if (Number.isNaN(received)) return null;

  const minutes = Math.floor((Date.now() - received) / 60_000);
  if (minutes < 5) return "Neue WhatsApp-Nachricht — zeitnah antworten wirkt professionell.";
  if (minutes < 60) return `Wartet seit ${minutes} Min. — HELPY empfiehlt eine kurze Rückmeldung.`;
  const hours = Math.floor(minutes / 60);
  return `Wartet seit ${hours} Std. — bitte priorisieren.`;
}

export function WhatsappHelpyPanel({
  messages,
  selectedMessage,
}: WhatsappHelpyPanelProps) {
  const openMessages = useMemo(
    () =>
      messages.filter(
        (item) => item.status === "neu" || item.status === "in_bearbeitung"
      ),
    [messages]
  );

  const recommendations = useMemo(() => {
    return openMessages
      .filter((item) => item.recommendedAction?.trim())
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.fromName ?? item.fromNumber,
        text: item.recommendedAction as string,
      }));
  }, [openMessages]);

  const waitHint = selectedMessage
    ? formatWaitHint(selectedMessage.receivedAt)
    : null;

  return (
    <HelpyPanelShell variant="helpy" subtitle="WhatsApp-Inbox">
      <div className="space-y-4 px-1">
        <Card className="border-[var(--border)] bg-[var(--bg-surface)] shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <WhatsappIcon size={16} className="mt-0.5" />
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {openMessages.length > 0
                  ? `${openMessages.length} offene WhatsApp-Nachricht${openMessages.length === 1 ? "" : "en"} — getrennt von E-Mail-Vorgängen.`
                  : "Keine offenen WhatsApp-Nachrichten. Neue Anfragen erscheinen hier automatisch."}
              </p>
            </div>
            {waitHint && selectedMessage ? (
              <p
                className={cn("mt-3 text-[12px] leading-relaxed")}
                style={{ color: WHATSAPP_BRAND_COLOR }}
              >
                {waitHint}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {selectedMessage?.recommendedAction ? (
          <div className="rounded-[14px] border border-[#DBEAFE] bg-[var(--accent-light)] p-4">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Lightbulb className="size-4" strokeWidth={2.25} />
              <p className="text-[12px] font-semibold">Empfehlung für Auswahl</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {selectedMessage.recommendedAction}
            </p>
          </div>
        ) : null}

        {recommendations.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
              Nächste Schritte
            </p>
            {recommendations.map((item) => (
              <div
                key={item.id}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5"
              >
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </HelpyPanelShell>
  );
}
