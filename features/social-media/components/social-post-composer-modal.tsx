"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { getRealEstateObjectById } from "@/features/real-estate/object/object-memory";
import { SocialPostImagePicker } from "@/features/social-media/components/social-post-image-picker";
import { readApiErrorMessage } from "@/lib/http/fetch-errors";
import {
  SOCIAL_PLATFORM_EMOJI,
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  SOCIAL_POST_CHAR_LIMITS,
  type SocialPlatform,
} from "@/features/social-media/types/social-media-types";

export type SocialPostComposerDraft = {
  platform: SocialPlatform;
  textContent: string;
  hashtags: string[];
  imageUrl: string | null;
  objektId?: string;
};

type SocialPostComposerModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<SocialPostComposerDraft> | null;
  title?: string;
  onSaved?: () => void;
};

export function SocialPostComposerModal({
  open,
  onClose,
  initial,
  title = "Post erstellen",
  onSaved,
}: SocialPostComposerModalProps) {
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [textContent, setTextContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const linkedObject = useMemo(() => {
    const id = initial?.objektId?.trim();
    if (!id || id === "manual") return null;
    return getRealEstateObjectById(id);
  }, [initial?.objektId, open]);

  useEffect(() => {
    if (!open) return;
    setPlatform(initial?.platform ?? "instagram");
    setTextContent(initial?.textContent ?? "");
    setHashtags(initial?.hashtags ?? []);
    setImageUrl(initial?.imageUrl ?? null);
    setError(null);
    setSavedMessage(null);
  }, [open, initial]);

  const addHashtag = (value: string) => {
    const tag = value.replace(/^#/, "").trim();
    if (!tag || hashtags.includes(tag)) return;
    setHashtags((current) => [...current, tag]);
  };

  const saveDraft = async () => {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const response = await fetch("/api/social-media/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          textContent,
          hashtags,
          imageUrl,
          objektId: initial?.objektId ?? "manual",
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, "Speichern fehlgeschlagen.")
        );
      }

      setSavedMessage("✓ Entwurf gespeichert");
      onSaved?.();
      window.setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Text anpassen und als Entwurf speichern — ohne Plattform-Verbindung möglich."
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-[12px]">
            Abbrechen
          </Button>
          <Button
            type="button"
            disabled={saving || !textContent.trim()}
            onClick={() => void saveDraft()}
            className="rounded-[12px]"
          >
            {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
            Speichern als Entwurf
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlatform(item)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                platform === item
                  ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
              }`}
            >
              {SOCIAL_PLATFORM_EMOJI[item]} {SOCIAL_PLATFORM_LABELS[item]}
            </button>
          ))}
        </div>

        <Textarea
          value={textContent}
          onChange={(event) => setTextContent(event.target.value)}
          rows={10}
          className="min-h-[200px] rounded-[12px] text-[13px]"
          placeholder="Post-Text eingeben …"
        />
        <p className="text-[11px] text-[var(--text-secondary)]">
          {textContent.length.toLocaleString("de-CH")} /{" "}
          {SOCIAL_POST_CHAR_LIMITS[platform].toLocaleString("de-CH")} Zeichen
        </p>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">Hashtags</p>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setHashtags((current) => current.filter((item) => item !== tag))}
                className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]"
              >
                #{tag} ✕
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const value = window.prompt("Hashtag hinzufügen (ohne #):");
                if (value) addHashtag(value);
              }}
              className="rounded-full border border-dashed border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">Bild</p>
          <SocialPostImagePicker
            value={imageUrl}
            onChange={setImageUrl}
            object={linkedObject}
            objektId={initial?.objektId}
            platform={platform}
          />
        </div>

        {error ? (
          <p className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
            {error}
          </p>
        ) : null}
        {savedMessage ? (
          <p className="text-[12px] font-medium text-[#047857]">{savedMessage}</p>
        ) : null}
      </div>
    </Modal>
  );
}
