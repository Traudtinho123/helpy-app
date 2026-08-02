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
  const [messageIsError, setMessageIsError] = useState(false);

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
    const result = await updateVoiceSettingsClient({ enabled: !settings.enabled });
    if (result.ok) {
      setSettings(result.settings);
      setMessageIsError(false);
      setMessage(
        result.settings.enabled ? "Voice Core aktiviert." : "Voice Core deaktiviert."
      );
    } else {
      setMessageIsError(true);
      setMessage(result.error);
    }
    setSaving(false);
  };

  const handleSaveResponses = async () => {
    setSaving(true);
    const result = await updateVoiceSettingsClient({
      greetingText: greetingDraft,
      disclosureText: disclosureDraft,
    });
    if (result.ok) {
      setSettings(result.settings);
      setMessageIsError(false);
      setMessage("Antworten gespeichert.");
    } else {
      setMessageIsError(true);
      setMessage(result.error);
    }
    setSaving(false);
  };

  const enabled = settings?.enabled ?? false;

  return (
    <section className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Voice Einstellungen</h3>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Begrüßung und KI-Hinweis für eingehende Gespräche.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            enabled
              ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/80 text-[#047857]"
              : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
          )}
        >
          {enabled ? "Aktiv" : "Inaktiv"}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
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
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">Antworten</p>
            <label className="mt-3 block text-[11px] font-semibold text-[var(--text-secondary)]">
              Begrüßung
            </label>
            <Textarea
              className="mt-1.5 min-h-[72px] text-[13px]"
              value={greetingDraft}
              onChange={(event) => setGreetingDraft(event.target.value)}
            />
            <label className="mt-3 block text-[11px] font-semibold text-[var(--text-secondary)]">
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
            <p
              className={cn(
                "rounded-[12px] border px-3 py-2 text-[12px]",
                messageIsError
                  ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
                  : "border-[var(--border-accent)] bg-[var(--accent-light)] text-[#1D4ED8]"
              )}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
