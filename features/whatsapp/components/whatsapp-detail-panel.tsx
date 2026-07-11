"use client";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { WhatsappIcon } from "@/features/whatsapp/components/whatsapp-icon";
import type { WhatsappMessage } from "@/features/whatsapp/types/whatsapp-types";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type WhatsappDetailPanelProps = {
  message: WhatsappMessage | null;
  onStatusChange: (id: string, status: WhatsappMessage["status"]) => void;
  updating?: boolean;
};

function formatPhone(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `+${digits}` : number;
}

export function WhatsappDetailPanel({
  message,
  onStatusChange,
  updating,
}: WhatsappDetailPanelProps) {
  if (!message) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
        <WhatsappIcon size={28} className="mx-auto opacity-60" />
        <p className="mt-4 text-sm font-medium text-[#64748B]">
          Wähle eine Nachricht aus der Liste.
        </p>
      </div>
    );
  }

  const displayName = message.fromName ?? formatPhone(message.fromNumber);
  const receivedAt = formatDateTime(message.receivedAt);

  return (
    <Panel>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <WhatsappIcon size={18} />
          <h2 className="text-sm font-semibold text-[#0F172A]">{displayName}</h2>
        </div>
      </PanelHeader>
      <PanelBody className="space-y-4">
        <div className="grid gap-2 text-[13px] text-[#64748B]">
          <p>
            <span className="font-medium text-[#0F172A]">Nummer:</span>{" "}
            {formatPhone(message.fromNumber)}
          </p>
          <p>
            <span className="font-medium text-[#0F172A]">Empfangen:</span> {receivedAt}
          </p>
          {message.customerName ? (
            <p>
              <span className="font-medium text-[#0F172A]">Kunde:</span>{" "}
              {message.customerName}
            </p>
          ) : null}
          {message.intentLabel ? (
            <p>
              <span className="font-medium text-[#0F172A]">Intent:</span>{" "}
              {message.intentLabel}
              {message.priority ? ` · ${message.priority}` : ""}
            </p>
          ) : null}
        </div>

        <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            Nachricht
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[#0F172A]">
            {message.body.trim() || "—"}
          </p>
        </div>

        {message.summary ? (
          <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              HELPY-Zusammenfassung
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#334155]">
              {message.summary}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {(["in_bearbeitung", "erledigt", "archiviert"] as const).map((status) => (
            <Button
              key={status}
              type="button"
              variant="outline"
              size="sm"
              disabled={updating || message.status === status}
              onClick={() => onStatusChange(message.id, status)}
              className={cn(message.status === status && "border-[#25D366]/40")}
            >
              {status === "in_bearbeitung"
                ? "In Bearbeitung"
                : status === "erledigt"
                  ? "Erledigt"
                  : "Archivieren"}
            </Button>
          ))}
        </div>

        <Button type="button" disabled className="w-full bg-[#25D366]/60">
          Antwort senden — kommt bald
        </Button>
      </PanelBody>
    </Panel>
  );
}
