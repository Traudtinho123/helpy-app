"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALWAYS_OPEN_VOICE_BUSINESS_HOURS } from "@/features/voice/services/voice-business-hours";
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

  const reload = useCallback(async () => {
    setLoading(true);
    const payload = await fetchTwilioSetup();
    setSetup(
      payload
        ? {
            configured: payload.configured,
            companyId: payload.companyId,
            phoneNumber: payload.phoneNumber,
          }
        : null
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const enableTwilioProvider = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await updateVoiceSettingsClient({
      enabled: true,
      provider: "twilio",
      phoneNumber: setup?.phoneNumber ?? settings.phoneNumber,
      businessHours: ALWAYS_OPEN_VOICE_BUSINESS_HOURS,
    });
    if (result.ok) {
      onSettingsChange(result.settings);
    } else {
      setSaveError(result.error);
    }
    setSaving(false);
  };

  const isActive = settings.enabled && settings.provider === "twilio";

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-[12px] text-[#64748B]", className)}>
        <Loader2 className="size-4 animate-spin" />
        Twilio-Setup laden…
      </div>
    );
  }

  if (isActive) {
    return null;
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
          Setze in Vercel: <code className="text-[11px]">TWILIO_ACCOUNT_SID</code>,{" "}
          <code className="text-[11px]">TWILIO_AUTH_TOKEN</code>,{" "}
          <code className="text-[11px]">TWILIO_PHONE_NUMBER</code>,{" "}
          <code className="text-[11px]">OPENAI_API_KEY</code>,{" "}
          <code className="text-[11px]">VOICE_WEBHOOK_BASE_URL</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={saving}
        onClick={() => void enableTwilioProvider()}
      >
        {saving ? "Wird aktiviert…" : "Twilio aktivieren"}
      </Button>

      {saveError ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
          <p className="font-semibold">Twilio konnte nicht aktiviert werden</p>
          <p className="mt-1 leading-relaxed">{saveError}</p>
        </div>
      ) : null}
    </div>
  );
}
