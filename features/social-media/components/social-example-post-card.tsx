"use client";

import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SOCIAL_PLATFORM_EMOJI,
  SOCIAL_PLATFORM_LABELS,
} from "@/features/social-media/types/social-media-types";
import type { SocialExamplePost } from "@/features/social-media/data/example-posts";

type SocialExamplePostCardProps = {
  example: SocialExamplePost;
  onTryDemo: (example: SocialExamplePost) => void;
};

export function SocialExamplePostCard({
  example,
  onTryDemo,
}: SocialExamplePostCardProps) {
  return (
    <article className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
      <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
        {SOCIAL_PLATFORM_EMOJI[example.platform]}{" "}
        {SOCIAL_PLATFORM_LABELS[example.platform]}-Post (Beispiel)
      </p>

      <div className="my-4 border-t border-[var(--border)]" />

      {example.platform === "instagram" ? (
        <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="text-center">
            <Home className="mx-auto size-10 text-[var(--text-muted)]" />
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">Bild-Platzhalter</p>
          </div>
        </div>
      ) : null}

      <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--text-primary)]">
        {example.textContent}
      </p>

      {example.hashtags.length > 0 ? (
        <p className="mt-3 text-[12px] text-[var(--accent)]">
          {example.hashtags.map((tag) => `#${tag}`).join(" ")}
        </p>
      ) : null}

      <div className="my-4 border-t border-[var(--border)]" />

      <p className="text-[12px] text-[var(--text-secondary)]">💬 {example.hint}</p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 rounded-[12px]"
        onClick={() => onTryDemo(example)}
      >
        Demo ausprobieren
      </Button>
    </article>
  );
}
