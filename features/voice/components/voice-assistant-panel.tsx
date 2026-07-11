"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import {
  fetchVoiceSettings,
  updateVoiceSettingsClient,
} from "@/features/voice/voice-settings";
import type { VoiceSettings } from "@/features/voice/types/voice-types";
import {
  DEFAULT_VOICE_DISCLOSURE,
  DEFAULT_VOICE_GREETING,
} from "@/features/voice/types/voice-types";
import { cn } from "@/lib/utils";

export function VoiceAssistantPanel() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [greetingDraft, setGreetingDraft] = useState(DEFAULT_VOICE_GREETING);
  const [disclosureDraft, setDisclosureDraft] = useState(DEFAULT_VOICE_DISCLOSURE);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const loaded = await fetchVoiceSettings();
    if (loaded) {
      setSettings(loaded);
      setGreetingDraft(loaded.greetingText);
      setDisclosureDraft(loaded.disclosureText);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleToggle = async () => {
    if (!settings) return;
    setSaving(true);
    const updated = await updateVoiceSettingsClient({ enabled: !settings.enabled });
    if (updated) {
      setSettings(updated);
      setMessage(updated.enabled ? "Voice Core aktiviert." : "Voice Core deaktiviert.");
    }
    setSaving(false);
  };

  const handleSaveResponses = async () => {
    setSaving(true);
    const updated = await updateVoiceSettingsClient({
      greetingText: greetingDraft,
      disclosureText: disclosureDraft,
    });
    if (updated) {
      setSettings(updated);
      setMessage("Antworten gespeichert.");
    }
    setSaving(false);
  };

  const enabled = settings?.enabled ?? false;

  return (
    <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Voice Einstellungen</h3>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Begrüßung und KI-Hinweis für eingehende Gespräche.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            enabled
              ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/80 text-[#047857]"
              : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
          )}
        >
          {enabled ? "Aktiv" : "Inaktiv"}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-[#64748B]">
          <Loader2 className="size-4 animate-spin" />
          Laden…
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <Button
            type="button"
            variant={enabled ? "outline" : "default"}
            size="sm"
            disabled={saving}
            onClick={() => void handleToggle()}
          >
            <Phone className="size-3.5" />
            {enabled ? "Deaktivieren" : "Aktivieren"}
          </Button>

          <div>
            <p className="text-[11px] font-semibold text-[#64748B]">Antworten</p>
            <label className="mt-3 block text-[11px] font-semibold text-[#64748B]">
              Begrüßung
            </label>
            <Textarea
              className="mt-1.5 min-h-[72px] text-[13px]"
              value={greetingDraft}
              onChange={(event) => setGreetingDraft(event.target.value)}
            />
            <label className="mt-3 block text-[11px] font-semibold text-[#64748B]">
              KI-Hinweis
            </label>
            <Textarea
              className="mt-1.5 min-h-[72px] text-[13px]"
              value={disclosureDraft}
              onChange={(event) => setDisclosureDraft(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={saving}
              onClick={() => void handleSaveResponses()}
            >
              <Save className="size-3.5" />
              Speichern
            </Button>
          </div>

          {message && (
            <p className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[12px] text-[#1D4ED8]">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
