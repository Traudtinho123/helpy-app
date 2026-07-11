"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
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
    <Panel variant="helpy">
      <PanelHeader className="h-auto items-start py-5">
        <div className="flex items-center gap-3">
          <HelpyAvatar />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              HELPY
            </h2>
            <p className="text-[12px] text-[#64748B]">WhatsApp-Inbox</p>
          </div>
        </div>
      </PanelHeader>
      <PanelBody className="space-y-4">
        <Card className="border-[#E2E8F0]/80 bg-white/90 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <WhatsappIcon size={16} className="mt-0.5" />
              <p className="text-[13px] leading-relaxed text-[#334155]">
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
          <div className="rounded-[14px] border border-[#DBEAFE] bg-[#EFF6FF] p-4">
            <div className="flex items-center gap-2 text-[#2563EB]">
              <Lightbulb className="size-4" strokeWidth={2.25} />
              <p className="text-[12px] font-semibold">Empfehlung für Auswahl</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#334155]">
              {selectedMessage.recommendedAction}
            </p>
          </div>
        ) : null}

        {recommendations.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              Nächste Schritte
            </p>
            {recommendations.map((item) => (
              <div
                key={item.id}
                className="rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2.5"
              >
                <p className="text-[12px] font-semibold text-[#0F172A]">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}
