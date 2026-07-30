"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  fetchPortalListing,
  getPortalListingSnapshot,
  subscribePortalListings,
} from "@/features/portal-publish/services/portal-client-store";
import type { ObjektPortalListing } from "@/features/portal-publish/types/portal-publish-types";
import { PORTAL_LABELS } from "@/features/portal-publish/types/portal-publish-types";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

type PortalPublishStatusProps = {
  objectId: string;
};

function formatSince(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PortalPublishStatus({ objectId }: PortalPublishStatusProps) {
  const revision = useStoreRevision(subscribePortalListings);
  const [listing, setListing] = useState<ObjektPortalListing | null>(() =>
    getPortalListingSnapshot(objectId)
  );

  useEffect(() => {
    setListing(getPortalListingSnapshot(objectId));
    void fetchPortalListing(objectId).then((data) => {
      setListing(data.listing);
    });
  }, [objectId, revision]);

  if (!listing) return null;

  const liveEntries = (
    [
      {
        portal: "immoscout24" as const,
        status: listing.portal_status.immoscout24,
        url: listing.immoscout_url,
      },
      {
        portal: "homegate" as const,
        status: listing.portal_status.homegate,
        url: listing.homegate_url,
      },
    ] as const
  ).filter((entry) => entry.status?.status === "live");

  if (liveEntries.length === 0) {
    const errors = (
      [
        listing.portal_status.immoscout24,
        listing.portal_status.homegate,
      ] as const
    ).filter(
      (entry) =>
        entry?.status === "fehler" || entry?.status === "nicht_konfiguriert"
    );

    if (errors.length === 0) return null;

    return (
      <div className="rounded-[14px] border border-[#FDE68A]/60 bg-[#FFFBEB]/60 px-3.5 py-2.5 text-[12px] text-[#92400E]">
        Portal-Publishing:{" "}
        {errors.map((entry) => entry?.error).filter(Boolean).join(" · ")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {liveEntries.map((entry) => (
        <div
          key={entry.portal}
          className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-[#A7F3D0]/70 bg-[#ECFDF5]/70 px-3.5 py-2.5"
        >
          <p className="text-[12px] font-medium text-[#047857]">
            🟢 Live auf {PORTAL_LABELS[entry.portal]} seit{" "}
            {formatSince(entry.status?.publishedAt ?? listing.portal_published_at)}
          </p>
          {entry.url ? (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] hover:underline"
            >
              Inserat öffnen
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
