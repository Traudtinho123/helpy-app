"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_VOICE_BUSINESS_HOURS,
  formatBusinessHoursSummary,
} from "@/features/voice/services/voice-business-hours";
import {
  fetchTwilioSetup,
  updateVoiceSettingsClient,
} from "@/features/voice/services/voice-settings-client";
import type { VoiceSettings } from "@/features/voice/types/voice-types";
import { cn } from "@/lib/utils";

type TwilioSetupPayload = {
  configured: boolean;
  companyId: string;
  phoneNumber: string | null;
  webhooks: {
    incoming: string;
    gather: string;
    status: string;
  };
  businessHoursSummary: string;
};

type VoiceTwilioSetupSectionProps = {
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  className?: string;
};

export function VoiceTwilioSetupSection({
  settings,
  onSettingsChange,
  className,
}: VoiceTwilioSetupSectionProps) {
  const [setup, setSetup] = useState<TwilioSetupPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const payload = await fetchTwilioSetup();
    setSetup(payload);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const copyUrl = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const enableTwilioProvider = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await updateVoiceSettingsClient({
      enabled: true,
      provider: "twilio",
      phoneNumber: setup?.phoneNumber ?? settings.phoneNumber,
      businessHours: settings.businessHours ?? DEFAULT_VOICE_BUSINESS_HOURS,
    });
    if (result.ok) {
      onSettingsChange(result.settings);
    } else {
      setSaveError(result.error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-[12px] text-[#64748B]", className)}>
        <Loader2 className="size-4 animate-spin" />
        Twilio-Setup laden…
      </div>
    );
  }

  if (!setup?.configured) {
    return (
      <div
        className={cn(
          "rounded-[16px] border border-[#FDE68A] bg-[#FFFBEB] p-4 text-[12px] text-[#92400E]",
          className
        )}
      >
        <p className="font-semibold">Twilio noch nicht konfiguriert</p>
        <p className="mt-1 leading-relaxed">
          Setze in <code className="text-[11px]">.env.local</code>:{" "}
          <code className="text-[11px]">TWILIO_ACCOUNT_SID</code>,{" "}
          <code className="text-[11px]">TWILIO_AUTH_TOKEN</code>,{" "}
          <code className="text-[11px]">TWILIO_PHONE_NUMBER</code>,{" "}
          <code className="text-[11px]">OPENAI_API_KEY</code>,{" "}
          <code className="text-[11px]">VOICE_WEBHOOK_BASE_URL</code> (öffentliche URL, z. B. ngrok
          oder Vercel).
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC]/80 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B] uppercase">
            <PhoneCall className="size-3.5" />
            Twilio Live (Phase 3)
          </p>
          <p className="mt-1 text-[12px] text-[#475569]">
            Nummer: {setup.phoneNumber ?? "—"} · Geschäftszeiten:{" "}
            {setup.businessHoursSummary || formatBusinessHoursSummary()}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving || settings.provider === "twilio"}
          onClick={() => void enableTwilioProvider()}
        >
          {settings.provider === "twilio" ? "Twilio aktiv" : "Twilio aktivieren"}
        </Button>
      </div>

      <div className="space-y-2">
        {(
          [
            ["Incoming Webhook", setup.webhooks.incoming],
            ["Gather Webhook", setup.webhooks.gather],
            ["Status Webhook", setup.webhooks.status],
          ] as const
        ).map(([label, url]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#64748B]">{label}</p>
              <p className="truncate text-[11px] text-[#334155]">{url}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0"
              onClick={() => void copyUrl(label, url)}
            >
              <Copy className="size-3.5" />
              {copied === label ? "OK" : "Kopieren"}
            </Button>
          </div>
        ))}
      </div>

      {saveError ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
          <p className="font-semibold">Twilio konnte nicht aktiviert werden</p>
          <p className="mt-1 leading-relaxed">{saveError}</p>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-[#64748B]">
        Trage die <strong>Incoming Webhook</strong>-URL in der Twilio Console unter deiner
        Telefonnummer ein. Eingehende Anrufe werden per Speech-to-Text verstanden und per TTS
        beantwortet. Vorgänge erscheinen automatisch in HELPY (Sync alle 45 Sek.).
      </p>
    </div>
  );
}
