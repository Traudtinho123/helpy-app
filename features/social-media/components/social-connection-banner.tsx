"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import type { SocialConnection } from "@/features/social-media/types/social-media-types";

type SocialConnectionBannerProps = {
  connections: SocialConnection[];
};

function isMetaConnected(connections: SocialConnection[]): boolean {
  return connections.some(
    (item) =>
      (item.platform === "meta" || item.platform === "instagram" || item.platform === "facebook") &&
      item.connected
  );
}

export function SocialConnectionBanner({ connections }: SocialConnectionBannerProps) {
  if (isMetaConnected(connections)) return null;

  return (
    <div className="rounded-[16px] border border-[var(--border-accent)] bg-[var(--accent-light)]/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--text-primary)]">
            <Smartphone className="size-4 text-[var(--accent)]" />
            Social Media noch nicht verbunden
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Verbinde Instagram &amp; Facebook, um automatisch zu posten.
          </p>
        </div>
        <Link
          href="/plattformen"
          className="inline-flex h-9 shrink-0 items-center rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
        >
          Jetzt verbinden →
        </Link>
      </div>
    </div>
  );
}
