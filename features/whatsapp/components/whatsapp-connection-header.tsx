"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WhatsappIcon } from "@/features/whatsapp/components/whatsapp-icon";
import type { WhatsappSummary } from "@/features/whatsapp/types/whatsapp-types";
import { WHATSAPP_BRAND_COLOR } from "@/features/whatsapp/types/whatsapp-types";
import { cn } from "@/lib/utils";

type WhatsappConnectionHeaderProps = {
  summary: WhatsappSummary;
  configured: boolean;
  onConnected: () => void;
};

export function WhatsappConnectionHeader({
  summary,
  configured,
  onConnected,
}: WhatsappConnectionHeaderProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const response = await fetch("/api/whatsapp/connection", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Verbindung fehlgeschlagen");
        return;
      }
      onConnected();
    } catch {
      setError("Verbindung fehlgeschlagen");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="mb-8 rounded-[20px] border border-[#E2E8F0] bg-white/80 p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-[12px] bg-[#25D366]/10">
            <WhatsappIcon size={22} />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#25D366]">
              WhatsApp Business
            </p>
            <p className="mt-1 text-sm font-medium text-[#0F172A]">
              {summary.connected
                ? summary.displayNumber
                  ? `Verbunden · ${summary.displayNumber}`
                  : "Verbunden mit Meta Cloud API"
                : configured
                  ? "Bereit — Verbindung im Mandanten aktivieren"
                  : "Meta-Zugangsdaten fehlen noch"}
            </p>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#64748B]">
              Eingehende WhatsApp-Nachrichten landen getrennt von E-Mail-Vorgängen
              in dieser Inbox. HELPY klassifiziert Intent und Priorität automatisch.
            </p>
          </div>
        </div>

        {!summary.connected && configured ? (
          <Button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="bg-[#25D366] text-white hover:bg-[#1ebe57]"
          >
            {connecting ? "Verbinde…" : "Verbinden"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-[13px] text-red-600">{error}</p>
      ) : null}

      {!configured ? (
        <div className="mt-4 rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[13px] leading-relaxed text-[#64748B]">
          <p className="font-medium text-[#0F172A]">Setup (Meta Developer Console)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>WhatsApp Business App anlegen und Phone Number ID notieren</li>
            <li>
              Webhook-URL:{" "}
              <code className="rounded bg-white px-1 py-0.5 text-[12px]">
                /api/whatsapp/webhook
              </code>
            </li>
            <li>
              Env setzen:{" "}
              <code className="rounded bg-white px-1 py-0.5 text-[12px]">
                WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_WEBHOOK_VERIFY_TOKEN, WHATSAPP_APP_SECRET
              </code>
            </li>
            <li>Lokal: ngrok http 3000 → Webhook-URL in Meta eintragen</li>
          </ol>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Offen", value: summary.openCount },
          { label: "Heute", value: summary.todayCount },
          { label: "7 Tage", value: summary.weekCount },
          { label: "Erledigt", value: summary.erledigtCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[14px] border border-[#E2E8F0]/80 bg-[#F8FAFC] px-3 py-2.5"
          >
            <p className="text-[11px] font-medium text-[#64748B]">{item.label}</p>
            <p
              className={cn(
                "mt-0.5 text-lg font-semibold tabular-nums tracking-[-0.02em]",
                item.label === "Offen" && item.value > 0
                  ? "text-[#25D366]"
                  : "text-[#0F172A]"
              )}
              style={item.label === "Offen" && item.value > 0 ? { color: WHATSAPP_BRAND_COLOR } : undefined}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
