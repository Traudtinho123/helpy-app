"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SocialConnection } from "@/features/social-media/types/social-media-types";

export function SocialPlatformSettings() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/social-media/connections");
      if (response.ok) {
        const payload = (await response.json()) as {
          connections: SocialConnection[];
        };
        setConnections(payload.connections);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const instagram = connections.find((item) => item.platform === "instagram");
  const facebook = connections.find((item) => item.platform === "facebook");
  const meta = connections.find((item) => item.platform === "meta");
  const linkedin = connections.find((item) => item.platform === "linkedin");

  const disconnect = async (platform: string) => {
    await fetch(`/api/social-media/connections?platform=${platform}`, {
      method: "DELETE",
    });
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
        <Loader2 className="size-4 animate-spin" />
        Social Media Verbindungen laden …
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[16px] border border-[#E2E8F0] bg-white p-5">
      <h3 className="text-[14px] font-semibold text-[#0F172A]">Social Media</h3>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E2E8F0] px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-[#334155]">
              📸 Instagram Business
            </p>
            <p className="text-[12px] text-[#64748B]">
              {instagram?.connected || meta?.instagramId
                ? `● Verbunden${meta?.pageName ? `: ${meta.pageName}` : ""}`
                : "○ Nicht verbunden"}
            </p>
          </div>
          {instagram?.connected || meta?.connected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void disconnect("meta")}
            >
              Trennen
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                window.location.href = "/api/oauth/meta/start?returnTo=/plattformen";
              }}
            >
              Verbinden
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E2E8F0] px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-[#334155]">
              👍 Facebook Page
            </p>
            <p className="text-[12px] text-[#64748B]">
              {facebook?.connected || meta?.connected
                ? `● Verbunden: ${facebook?.pageName ?? meta?.pageName ?? "Facebook Page"}`
                : "○ Nicht verbunden"}
            </p>
          </div>
          {facebook?.connected || meta?.connected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void disconnect("facebook")}
            >
              Trennen
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                window.location.href = "/api/oauth/meta/start?returnTo=/plattformen";
              }}
            >
              Verbinden
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E2E8F0] px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-[#334155]">
              💼 LinkedIn Organisation
            </p>
            <p className="text-[12px] text-[#64748B]">
              {linkedin?.connected
                ? `● Verbunden: ${linkedin.pageName ?? linkedin.linkedinOrgId}`
                : "○ Nicht verbunden"}
            </p>
          </div>
          {linkedin?.connected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void disconnect("linkedin")}
            >
              Trennen
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                window.location.href =
                  "/api/oauth/linkedin/start?returnTo=/plattformen";
              }}
            >
              Verbinden
            </Button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#94A3B8]">
        Tokens werden verschlüsselt in Supabase gespeichert. Es wird nie automatisch
        gepostet — du bestätigst jeden Post manuell.
      </p>

      <Link
        href="/social-media"
        className="text-[12px] font-medium text-[#2563EB] hover:underline"
      >
        Social Media Posts öffnen →
      </Link>
    </div>
  );
}
