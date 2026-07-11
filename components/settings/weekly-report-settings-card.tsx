"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyReportSettingsCard() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/profile/weekly-report")
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { enabled?: boolean };
        setEnabled(data.enabled ?? true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async () => {
    const next = !enabled;
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/profile/weekly-report", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setFeedback(data.error ?? "Speichern fehlgeschlagen.");
        return;
      }

      setEnabled(next);
      setFeedback(
        next
          ? "Wochenbericht aktiviert — jeden Montag um 05:30 Uhr."
          : "Wochenbericht deaktiviert."
      );
    } catch {
      setFeedback("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }, [enabled]);

  return (
    <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
      <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-[#2563EB]" strokeWidth={2} />
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Wöchentlicher HELPY-Bericht
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <p className="text-[13px] leading-relaxed text-[#64748B]">
          Jeden Montag um 05:30 Uhr (Europe/Zurich) sendet HELPY dir eine
          Zusammenfassung über deine verbundene Gmail-Adresse — Kennzahlen,
          offene Vorgänge und Empfehlungen.
        </p>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 px-4 py-3">
          <span className="text-[13px] font-medium text-[#0F172A]">
            Wochenbericht per E-Mail erhalten
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={loading || saving}
            onClick={() => {
              void handleToggle();
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              enabled ? "bg-[#2563EB]" : "bg-[#CBD5E1]"
            } ${loading || saving ? "opacity-60" : ""}`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        {feedback && (
          <p className="text-[12px] text-[#047857]">{feedback}</p>
        )}
      </CardContent>
    </Card>
  );
}
