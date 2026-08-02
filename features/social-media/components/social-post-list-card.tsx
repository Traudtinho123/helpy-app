"use client";

import {
  SOCIAL_PLATFORM_EMOJI,
  SOCIAL_PLATFORM_LABELS,
  type SocialPost,
} from "@/features/social-media/types/social-media-types";

type SocialPostListCardProps = {
  post: SocialPost;
  onEdit?: (post: SocialPost) => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<SocialPost["status"], string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  published: "Veröffentlicht",
  failed: "Fehlgeschlagen",
};

export function SocialPostListCard({ post, onEdit }: SocialPostListCardProps) {
  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
          {SOCIAL_PLATFORM_EMOJI[post.platform]} {SOCIAL_PLATFORM_LABELS[post.platform]}
        </p>
        <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          {STATUS_LABELS[post.status]}
        </span>
      </div>

      <p className="mt-3 line-clamp-4 whitespace-pre-line text-[13px] text-[var(--text-primary)]">
        {post.textContent ?? "—"}
      </p>

      {post.hashtags.length > 0 ? (
        <p className="mt-2 line-clamp-2 text-[11px] text-[var(--accent)]">
          {post.hashtags.map((tag) => `#${tag}`).join(" ")}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] text-[var(--text-muted)]">
        {post.status === "published"
          ? `Veröffentlicht ${formatDate(post.publishedAt)}`
          : post.status === "scheduled"
            ? `Geplant ${formatDate(post.scheduledAt)}`
            : `Erstellt ${formatDate(post.createdAt)}`}
      </p>

      {onEdit && post.status !== "published" ? (
        <button
          type="button"
          onClick={() => onEdit(post)}
          className="mt-3 text-[12px] font-medium text-[var(--accent)] hover:underline"
        >
          Bearbeiten
        </button>
      ) : null}
    </article>
  );
}
