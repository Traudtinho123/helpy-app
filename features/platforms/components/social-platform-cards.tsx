"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Unplug } from "lucide-react";
import {
  PlatformCard,
  PlatformCardButton,
} from "@/features/platforms/components/platform-card";
import type { SocialConnection } from "@/features/social-media/types/social-media-types";

type SocialCardConfig = {
  brand: "instagram" | "facebook" | "linkedin";
  name: string;
  description: string;
  connectHref: string;
  disconnectPlatform: string;
  isConnected: (connections: SocialConnection[]) => boolean;
  accountLabel: (connections: SocialConnection[]) => string | null;
};

const SOCIAL_CARDS: SocialCardConfig[] = [
  {
    brand: "instagram",
    name: "Instagram Business",
    description: "Objekt-Posts auf Instagram vorbereiten und nach Freigabe veröffentlichen.",
    connectHref: "/api/oauth/meta/start?returnTo=/plattformen",
    disconnectPlatform: "meta",
    isConnected: (c) =>
      c.some(
        (item) =>
          (item.platform === "instagram" || item.platform === "meta") &&
          item.connected
      ),
    accountLabel: (c) => {
      const meta = c.find((item) => item.platform === "meta");
      const ig = c.find((item) => item.platform === "instagram");
      return meta?.pageName ?? ig?.pageName ?? null;
    },
  },
  {
    brand: "facebook",
    name: "Facebook Page",
    description: "Inserate und Updates auf deiner Facebook-Unternehmensseite teilen.",
    connectHref: "/api/oauth/meta/start?returnTo=/plattformen",
    disconnectPlatform: "facebook",
    isConnected: (c) =>
      c.some(
        (item) =>
          (item.platform === "facebook" || item.platform === "meta") &&
          item.connected
      ),
    accountLabel: (c) => {
      const fb = c.find((item) => item.platform === "facebook");
      const meta = c.find((item) => item.platform === "meta");
      return fb?.pageName ?? meta?.pageName ?? null;
    },
  },
  {
    brand: "linkedin",
    name: "LinkedIn Organisation",
    description: "Professionelle Objekt-Posts für Investoren und Partner veröffentlichen.",
    connectHref: "/api/oauth/linkedin/start?returnTo=/plattformen",
    disconnectPlatform: "linkedin",
    isConnected: (c) =>
      c.some((item) => item.platform === "linkedin" && item.connected),
    accountLabel: (c) => {
      const li = c.find((item) => item.platform === "linkedin");
      return li?.pageName ?? li?.linkedinOrgId ?? null;
    },
  },
];

function SocialPlatformCard({
  config,
  connections,
  onDisconnect,
  busy,
  setBusy,
}: {
  config: SocialCardConfig;
  connections: SocialConnection[];
  onDisconnect: (platform: string) => Promise<void>;
  busy: string | null;
  setBusy: (value: string | null) => void;
}) {
  const connected = config.isConnected(connections);
  const account = config.accountLabel(connections);

  return (
    <PlatformCard
      brand={config.brand}
      name={config.name}
      description={config.description}
      status={connected ? "verbunden" : "nicht_verbunden"}
      account={account}
      actions={
        connected ? (
          <PlatformCardButton
            variant="outline"
            disabled={busy === config.disconnectPlatform}
            onClick={() => {
              setBusy(config.disconnectPlatform);
              void onDisconnect(config.disconnectPlatform).finally(() =>
                setBusy(null)
              );
            }}
          >
            {busy === config.disconnectPlatform ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Unplug className="size-3.5" />
            )}
            Trennen
          </PlatformCardButton>
        ) : (
          <PlatformCardButton
            onClick={() => {
              window.location.href = config.connectHref;
            }}
          >
            Jetzt verbinden →
          </PlatformCardButton>
        )
      }
    />
  );
}

export function SocialPlatformCards() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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

  const disconnect = async (platform: string) => {
    await fetch(`/api/social-media/connections?platform=${platform}`, {
      method: "DELETE",
    });
    await load();
  };

  if (loading) {
    return (
      <>
        {SOCIAL_CARDS.map((card) => (
          <article
            key={card.brand}
            className="flex h-full min-h-[240px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-5"
          >
            <Loader2 className="size-5 animate-spin text-[var(--text-secondary)]" />
          </article>
        ))}
      </>
    );
  }

  return (
    <>
      {SOCIAL_CARDS.map((card) => (
        <SocialPlatformCard
          key={card.brand}
          config={card}
          connections={connections}
          onDisconnect={disconnect}
          busy={busy}
          setBusy={setBusy}
        />
      ))}
    </>
  );
}
