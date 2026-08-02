"use client";

import type { SocialPost } from "@/features/social-media/types/social-media-types";
import {
  SOCIAL_PLATFORM_EMOJI,
  SOCIAL_PLATFORM_LABELS,
} from "@/features/social-media/types/social-media-types";

type SocialPostHistoryProps = {
  posts: SocialPost[];
};

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
  });
}

function engagementLabel(post: SocialPost): string {
  const e = post.engagement;
  if (post.platform === "instagram") {
    return `${e.likes ?? 0} Likes`;
  }
  if (post.platform === "facebook") {
    return `${e.reactions ?? e.likes ?? 0} Reaktionen`;
  }
  return `${e.interactions ?? e.likes ?? 0} Interaktionen`;
}

export function SocialPostHistory({ posts }: SocialPostHistoryProps) {
  const published = posts.filter((post) => post.status === "published");

  if (published.length === 0) {
    return (
      <p className="text-[12px] text-[var(--text-secondary)]">
        📱 Noch nicht auf Social Media gepostet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-semibold text-[var(--text-secondary)]">📱 Zuletzt gepostet</p>
      <ul className="space-y-1.5">
        {published.map((post) => (
          <li
            key={post.id}
            className="text-[12px] text-[var(--text-muted)]"
          >
            {SOCIAL_PLATFORM_EMOJI[post.platform]}{" "}
            {SOCIAL_PLATFORM_LABELS[post.platform]} · {formatShortDate(post.publishedAt)} ·{" "}
            {engagementLabel(post)}
          </li>
        ))}
      </ul>
    </div>
  );
}
