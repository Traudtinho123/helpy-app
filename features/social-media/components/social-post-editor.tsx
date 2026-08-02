"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Loader2,
  RefreshCw,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import {
  SOCIAL_PLATFORM_EMOJI,
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_POST_CHAR_LIMITS,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  type SocialPost,
} from "@/features/social-media/types/social-media-types";

type SocialPostEditorProps = {
  object: RealEstateObject;
  initialPosts?: SocialPost[];
  onPostsChange?: (posts: SocialPost[]) => void;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SocialPostEditor({
  object,
  initialPosts = [],
  onPostsChange,
}: SocialPostEditorProps) {
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [activePlatform, setActivePlatform] =
    useState<SocialPlatform>("instagram");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<SocialPlatform | "all" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"now" | "plan">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const activePost = useMemo(
    () => posts.find((post) => post.platform === activePlatform) ?? null,
    [activePlatform, posts]
  );

  const coverImage =
    activePost?.imageUrl ??
    object.images.find((image) => image.isCover)?.url ??
    object.images[0]?.url ??
    null;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/social-media/generate?objekt_id=${encodeURIComponent(object.objectId)}`
      );
      if (response.ok) {
        const payload = (await response.json()) as { posts: SocialPost[] };
        setPosts(payload.posts);
        onPostsChange?.(payload.posts);
      }
    } catch {
      setError("Posts konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [object.objectId, onPostsChange]);

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts);
      return;
    }
    void loadPosts();
  }, [initialPosts, loadPosts]);

  const updateLocalPost = (patch: Partial<SocialPost>) => {
    if (!activePost) return;
    setPosts((current) => {
      const next = current.map((post) =>
        post.id === activePost.id ? { ...post, ...patch } : post
      );
      onPostsChange?.(next);
      return next;
    });
  };

  const savePost = async (post: SocialPost) => {
    const response = await fetch("/api/social-media/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        textContent: post.textContent,
        hashtags: post.hashtags,
        imageUrl: post.imageUrl,
        scheduledAt:
          scheduleMode === "plan" && scheduledDate && scheduledTime
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : null,
      }),
    });

    if (!response.ok) {
      throw new Error("Speichern fehlgeschlagen.");
    }

    const payload = (await response.json()) as { post: SocialPost };
    setPosts((current) => {
      const next = current.map((item) =>
        item.id === payload.post.id ? payload.post : item
      );
      onPostsChange?.(next);
      return next;
    });
    return payload.post;
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/social-media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ object }),
      });
      if (!response.ok) {
        throw new Error("Generierung fehlgeschlagen.");
      }
      const payload = (await response.json()) as { posts: SocialPost[] };
      setPosts(payload.posts);
      onPostsChange?.(payload.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generierung fehlgeschlagen.");
    } finally {
      setGenerating(false);
    }
  };

  const publishPost = async (platform: SocialPlatform) => {
    const post = posts.find((item) => item.platform === platform);
    if (!post) return;

    setPublishing(platform);
    setError(null);

    try {
      const saved = await savePost(post);
      const response = await fetch(
        `/api/social-media/posts/${saved.id}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textContent: saved.textContent,
            hashtags: saved.hashtags,
            imageUrl: saved.imageUrl,
            title: object.titel,
          }),
        }
      );

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Veröffentlichen fehlgeschlagen.");
      }

      const payload = (await response.json()) as { post: SocialPost };
      setPosts((current) => {
        const next = current.map((item) =>
          item.id === payload.post.id ? payload.post : item
        );
        onPostsChange?.(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Veröffentlichen fehlgeschlagen.");
    } finally {
      setPublishing(null);
    }
  };

  const publishAll = async () => {
    setPublishing("all");
    for (const platform of SOCIAL_PLATFORMS) {
      const post = posts.find((item) => item.platform === platform);
      if (post?.status !== "published") {
        await publishPost(platform);
      }
    }
    setPublishing(null);
  };

  const addHashtag = (value: string) => {
    const tag = value.replace(/^#/, "").trim();
    if (!tag || !activePost) return;
    if (activePost.hashtags.includes(tag)) return;
    updateLocalPost({ hashtags: [...activePost.hashtags, tag] });
  };

  const removeHashtag = (tag: string) => {
    if (!activePost) return;
    updateLocalPost({
      hashtags: activePost.hashtags.filter((item) => item !== tag),
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-[13px] text-[var(--text-secondary)]">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Social Media Posts werden geladen …
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            Posts für: {object.adresse}, {object.ort}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Status: Entwurf · Erstellt {formatDateTime(activePost?.createdAt ?? null)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={generating}
          onClick={() => void handleRegenerate()}
          className="rounded-[12px]"
        >
          {generating ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 size-3.5" />
          )}
          Neu generieren
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => setActivePlatform(platform)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
              activePlatform === platform
                ? "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {SOCIAL_PLATFORM_EMOJI[platform]} {SOCIAL_PLATFORM_LABELS[platform]}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[12px] text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {activePost ? (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {SOCIAL_PLATFORM_LABELS[activePlatform]}
          </p>

          <Textarea
            value={activePost.textContent ?? ""}
            onChange={(event) =>
              updateLocalPost({ textContent: event.target.value })
            }
            rows={8}
            className="mb-2 min-h-[180px] rounded-[12px] text-[13px]"
          />
          <p className="mb-4 text-[11px] text-[var(--text-secondary)]">
            {(activePost.textContent ?? "").length.toLocaleString("de-CH")} /{" "}
            {SOCIAL_POST_CHAR_LIMITS[activePlatform].toLocaleString("de-CH")}{" "}
            Zeichen
          </p>

          <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">Hashtags</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {activePost.hashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeHashtag(tag)}
                className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
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

          <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">Bild</p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {coverImage ? (
              <div className="relative size-24 overflow-hidden rounded-[12px] border border-[var(--border)]">
                {coverImage.startsWith("http") ? (
                  <Image
                    src={coverImage}
                    alt="Objektbild"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage}
                    alt="Objektbild"
                    className="size-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="flex size-24 items-center justify-center rounded-[12px] border border-dashed border-[var(--border)] text-[11px] text-[var(--text-muted)]">
                Kein Bild
              </div>
            )}
            <select
              className="rounded-[10px] border border-[var(--border)] px-3 py-2 text-[12px]"
              value={activePost.imageUrl ?? ""}
              onChange={(event) =>
                updateLocalPost({ imageUrl: event.target.value || null })
              }
            >
              <option value="">Kein Bild</option>
              {object.images.map((image) => (
                <option key={image.id} value={image.url}>
                  {image.fileName || image.id}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">
            Veröffentlichen
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-[12px] text-[var(--text-secondary)]">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={scheduleMode === "now"}
                onChange={() => setScheduleMode("now")}
              />
              Jetzt
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={scheduleMode === "plan"}
                onChange={() => setScheduleMode("plan")}
              />
              Planen
            </label>
            {scheduleMode === "plan" ? (
              <>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  className="rounded-[10px] border border-[var(--border)] px-2 py-1"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                  className="rounded-[10px] border border-[var(--border)] px-2 py-1"
                />
              </>
            ) : null}
          </div>

          {activePost.status === "published" ? (
            <p className="mb-3 text-[12px] text-[#047857]">
              ✓ Veröffentlicht am {formatDateTime(activePost.publishedAt)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void publishPost(activePlatform)}
              disabled={publishing !== null}
              className="rounded-[12px]"
            >
              {publishing === activePlatform ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Share2 className="mr-1.5 size-3.5" />
              )}
              {SOCIAL_PLATFORM_EMOJI[activePlatform]} Nur{" "}
              {SOCIAL_PLATFORM_LABELS[activePlatform]}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => activePost && void savePost(activePost)}
              className="rounded-[12px]"
            >
              Entwurf speichern
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] px-4 py-8 text-center text-[13px] text-[var(--text-secondary)]">
          Noch keine Posts — bitte generieren.
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        <Button
          type="button"
          onClick={() => void publishAll()}
          disabled={publishing !== null || posts.length === 0}
          className="rounded-[12px] bg-[#047857] hover:bg-[#065F46]"
        >
          {publishing === "all" ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 size-3.5" />
          )}
          Alle veröffentlichen
        </Button>
      </div>
    </div>
  );
}
