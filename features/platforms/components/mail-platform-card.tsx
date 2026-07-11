"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Unplug } from "lucide-react";
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
  emoji: string;
  description: string;
  onSyncAccount?: (connection: OAuthConnectionPublic) => Promise<void>;
};

function formatRelativeSync(iso: string | null): string {
  if (!iso) return "—";
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 2) return "Gerade eben";
  if (minutes < 60) return `Vor ${minutes} Min.`;
  return `Vor ${Math.round(minutes / 60)} Std.`;
}

function summarizeAccounts(accounts: OAuthConnectionPublic[]): {
  account: string;
  lastSync: string;
  eventsToday: number;
  status: "verbunden" | "nicht_verbunden" | "fehler";
  errorMessage: string | null;
} {
  if (accounts.length === 0) {
    return {
      account: "—",
      lastSync: "—",
      eventsToday: 0,
      status: "nicht_verbunden",
      errorMessage: null,
    };
  }

  const hasError = accounts.some((account) => account.status === "error");
  const latestSync = accounts
    .map((account) => account.lastSyncAt)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b!) - Date.parse(a!))[0];

  return {
    account:
      accounts.length === 1
        ? accounts[0].accountEmail
        : `${accounts.length} Konten verbunden`,
    lastSync: formatRelativeSync(latestSync ?? null),
    eventsToday: 0,
    status: hasError ? "fehler" : "verbunden",
    errorMessage: hasError
      ? accounts.find((account) => account.lastError)?.lastError ?? "Verbindungsfehler"
      : null,
  };
}

export function MailPlatformCard({
  provider,
  name,
  emoji,
  description,
  onSyncAccount,
}: MailPlatformCardProps) {
  const [accounts, setAccounts] = useState<OAuthConnectionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const handleConnect = () => {
    if (provider === "google") {
      startGoogleMailConnect();
      return;
    }
    startMicrosoftMailConnect();
  };

  const handleDisconnect = async () => {
    if (!primaryAccount) return;
    setBusyId(primaryAccount.id);
    await disconnectOAuthConnection(primaryAccount.id);
    await reload();
    setBusyId(null);
  };

  const handleSync = async () => {
    if (!primaryAccount || !onSyncAccount) return;
    setBusyId(primaryAccount.id);
    await onSyncAccount(primaryAccount);
    await reload();
    setBusyId(null);
  };

  if (loading) {
    return (
      <article className="flex h-full min-h-[320px] items-center justify-center rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <Loader2 className="size-5 animate-spin text-[#64748B]" />
      </article>
    );
  }

  return (
    <PlatformCard
      emoji={emoji}
      name={name}
      description={description}
      status={summary.status}
      account={summary.account}
      lastSync={summary.lastSync}
      eventsToday={summary.eventsToday}
      errorMessage={summary.errorMessage}
      actions={
        summary.status === "nicht_verbunden" ? (
          <PlatformCardButton onClick={handleConnect}>
            <Plus className="size-3.5" />
            Verbinden
          </PlatformCardButton>
        ) : (
          <>
            {onSyncAccount && (
              <PlatformCardButton
                onClick={() => void handleSync()}
                disabled={busyId !== null}
              >
                {busyId ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Synchronisieren
              </PlatformCardButton>
            )}
            <PlatformCardButton
              variant="outline"
              onClick={() => void handleDisconnect()}
              disabled={busyId !== null}
            >
              {busyId ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Unplug className="size-3.5" />
              )}
              Trennen
            </PlatformCardButton>
            <PlatformCardButton variant="outline" onClick={handleConnect}>
              <Plus className="size-3.5" />
              Weiteres Konto
            </PlatformCardButton>
          </>
        )
      }
    />
  );
}
