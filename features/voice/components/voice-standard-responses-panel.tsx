"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import {
  deleteVoiceStandardResponse,
  fetchVoiceStandardResponses,
  saveVoiceStandardResponse,
} from "@/features/voice/services/voice-settings-client";
import {
  VOICE_STANDARD_RESPONSE_CATEGORY_LABELS,
  type VoiceStandardResponse,
  type VoiceStandardResponseCategory,
} from "@/features/voice/types/voice-standard-response-types";

const CATEGORIES: VoiceStandardResponseCategory[] = [
  "allgemein",
  "objekte",
  "termine",
  "preise",
];

function isPersistedId(id: string): boolean {
  return !id.startsWith("draft-") && !id.startsWith("dev-");
}

export function VoiceStandardResponsesPanel() {
  const [responses, setResponses] = useState<VoiceStandardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const result = await fetchVoiceStandardResponses();
    setResponses(result.responses);
    setLoadError(result.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!savedId) return;
    const timeout = window.setTimeout(() => setSavedId(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [savedId]);

  const handleToggle = async (item: VoiceStandardResponse) => {
    if (!isPersistedId(item.id)) return;

    setSavingId(item.id);
    setActionError(null);

    const result = await saveVoiceStandardResponse({
      id: item.id,
      triggerText: item.triggerText,
      responseText: item.responseText,
      category: item.category,
      enabled: !item.enabled,
    });

    if (result.ok) {
      setResponses((current) =>
        current.map((row) => (row.id === result.response.id ? result.response : row))
      );
      setSavedId(result.response.id);
    } else {
      setActionError(result.error);
    }

    setSavingId(null);
  };

  const handleSave = async (item: VoiceStandardResponse) => {
    setSavingId(item.id);
    setActionError(null);

    const result = await saveVoiceStandardResponse({
      id: isPersistedId(item.id) ? item.id : undefined,
      triggerText: item.triggerText,
      responseText: item.responseText,
      category: item.category,
      enabled: item.enabled,
    });

    if (result.ok) {
      setSavedId(result.response.id);
      await reload();
    } else {
      setActionError(result.error);
    }

    setSavingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!isPersistedId(id)) {
      setResponses((current) => current.filter((row) => row.id !== id));
      return;
    }

    setSavingId(id);
    setActionError(null);

    const result = await deleteVoiceStandardResponse(id);
    if (result.ok) {
      await reload();
    } else {
      setActionError(result.error);
    }

    setSavingId(null);
  };

  const addResponse = () => {
    setResponses((current) => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        companyId: "",
        triggerText: "",
        responseText: "",
        category: "allgemein",
        enabled: true,
        sortOrder: current.length + 1,
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const updateDraft = (
    id: string,
    patch: Partial<Pick<VoiceStandardResponse, "triggerText" | "responseText" | "category">>
  ) => {
    setResponses((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
        <Loader2 className="size-4 animate-spin" />
        Standard-Antworten laden…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Vordefinierte Antworten werden dem GPT-4o System-Prompt hinzugefügt, damit HELPY bei
        passenden Fragen konsistent antwortet. Änderungen werden in Supabase gespeichert.
      </p>

      {loadError ? (
        <div className="rounded-[12px] border border-[var(--warning)]/30 bg-[var(--warning-light)] px-4 py-3 text-[13px] text-[var(--warning)]">
          {loadError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="space-y-4">
        {responses.map((item) => (
          <article
            key={item.id}
            className="helpy-glass-card rounded-[16px] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  disabled={savingId === item.id || !isPersistedId(item.id)}
                  onChange={() => void handleToggle(item)}
                />
                {item.enabled ? "Aktiv" : "Inaktiv"}
              </label>
              <select
                className="rounded-lg border border-[var(--card-border)] bg-white px-2 py-1 text-[12px]"
                value={item.category}
                onChange={(event) =>
                  updateDraft(item.id, {
                    category: event.target.value as VoiceStandardResponseCategory,
                  })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {VOICE_STANDARD_RESPONSE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <label className="mt-3 block text-[11px] font-semibold uppercase text-[var(--text-muted)]">
              Frage / Trigger
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] px-3 py-2 text-[13px]"
              value={item.triggerText}
              onChange={(event) =>
                updateDraft(item.id, { triggerText: event.target.value })
              }
              placeholder="z. B. Öffnungszeiten"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase text-[var(--text-muted)]">
              Vordefinierte Antwort
            </label>
            <Textarea
              className="mt-1 min-h-[80px] text-[13px]"
              value={item.responseText}
              onChange={(event) =>
                updateDraft(item.id, { responseText: event.target.value })
              }
              placeholder="Antwort die HELPY am Telefon geben soll"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={
                  savingId === item.id ||
                  !item.triggerText.trim() ||
                  !item.responseText.trim()
                }
                onClick={() => void handleSave(item)}
              >
                {savingId === item.id ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Speichern…
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>

              {savedId === item.id ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--success)]">
                  <CheckCircle2 className="size-3.5" />
                  Gespeichert ✓
                </span>
              ) : null}

              {isPersistedId(item.id) ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={savingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                >
                  <Trash2 className="size-3.5" />
                  Löschen
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!loadError ? (
        <Button type="button" variant="outline" size="sm" onClick={addResponse}>
          <Plus className="size-3.5" />
          Standard-Antwort hinzufügen
        </Button>
      ) : null}
    </div>
  );
}
