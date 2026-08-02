"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Unplug } from "lucide-react";
import {
  PlatformCard,
  PlatformCardButton,
} from "@/features/platforms/components/platform-card";
import {
  disconnectOAuthConnection,
  fetchOAuthConnections,
  migrateLegacyOAuthTokens,
  startGoogleMailConnect,
  startMicrosoftMailConnect,
} from "@/features/oauth/services/oauth-connections-client";
import type { OAuthConnectionPublic } from "@/lib/oauth/types";

type MailPlatformCardProps = {
  provider: "google" | "microsoft";
  name: string;
  description: string;
};

function summarizeAccounts(accounts: OAuthConnectionPublic[]): {
  account: string | null;
  status: "verbunden" | "nicht_verbunden" | "fehler";
  errorMessage: string | null;
} {
  if (accounts.length === 0) {
    return {
      account: null,
      status: "nicht_verbunden",
      errorMessage: null,
    };
  }

  const hasError = accounts.some((account) => account.status === "error");

  return {
    account:
      accounts.length === 1
        ? accounts[0].accountEmail
        : `${accounts.length} Konten verbunden`,
    status: hasError ? "fehler" : "verbunden",
    errorMessage: hasError
      ? accounts.find((account) => account.lastError)?.lastError ??
        "Verbindungsfehler"
      : null,
  };
}

export function MailPlatformCard({
  provider,
  name,
  description,
}: MailPlatformCardProps) {
  const [accounts, setAccounts] = useState<OAuthConnectionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    await migrateLegacyOAuthTokens();
    const payload = await fetchOAuthConnections(provider);
    setAccounts(payload?.grouped[provider] ?? []);
    setLoading(false);
  }, [provider]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summary = summarizeAccounts(accounts);
  const primaryAccount = accounts[0] ?? null;
  const brand = provider === "google" ? "gmail" : "outlook";

  const handleConnect = () => {
    if (provider === "google") {
      startGoogleMailConnect();
      return;
    }
    startMicrosoftMailConnect();
  };

  const handleDisconnect = async () => {
    if (!primaryAccount) return;
    setBusy(true);
    await disconnectOAuthConnection(primaryAccount.id);
    await reload();
    setBusy(false);
  };

  if (loading) {
    return (
      <article className="flex h-full min-h-[240px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <Loader2 className="size-5 animate-spin text-[var(--text-secondary)]" />
      </article>
    );
  }

  return (
    <PlatformCard
      brand={brand}
      name={name}
      description={description}
      status={summary.status}
      account={summary.account}
      errorMessage={summary.errorMessage}
      actions={
        summary.status === "nicht_verbunden" ? (
          <PlatformCardButton onClick={handleConnect}>Jetzt verbinden →</PlatformCardButton>
        ) : (
          <PlatformCardButton
            variant="outline"
            onClick={() => void handleDisconnect()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Unplug className="size-3.5" />
            )}
            Trennen
          </PlatformCardButton>
        )
      }
    />
  );
}
