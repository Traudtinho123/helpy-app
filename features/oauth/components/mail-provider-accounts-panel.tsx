"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Plus, RefreshCw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disconnectOAuthConnection,
  fetchOAuthConnections,
  migrateLegacyOAuthTokens,
  startGoogleMailConnect,
  startMicrosoftMailConnect,
} from "@/features/oauth/services/oauth-connections-client";
import type { OAuthConnectionPublic } from "@/lib/oauth/types";
import { cn } from "@/lib/utils";

type MailProviderAccountsPanelProps = {
  provider: "google" | "microsoft";
  title: string;
  emoji: string;
  description: string;
  onSyncAccount?: (connection: OAuthConnectionPublic) => Promise<void>;
  className?: string;
};

function formatRelativeSync(iso: string | null): string {
  if (!iso) return "Noch nicht synchronisiert";
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 2) return "Gerade eben";
  if (minutes < 60) return `Vor ${minutes} Min.`;
  return `Vor ${Math.round(minutes / 60)} Std.`;
}

export function MailProviderAccountsPanel({
  provider,
  title,
  emoji,
  description,
  onSyncAccount,
  className,
}: MailProviderAccountsPanelProps) {
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

  const handleConnect = () => {
    if (provider === "google") {
      startGoogleMailConnect();
      return;
    }
    startMicrosoftMailConnect();
  };

  const handleDisconnect = async (connectionId: string) => {
    setBusyId(connectionId);
    await disconnectOAuthConnection(connectionId);
    await reload();
    setBusyId(null);
  };

  const handleSync = async (connection: OAuthConnectionPublic) => {
    if (!onSyncAccount) return;
    setBusyId(connection.id);
    await onSyncAccount(connection);
    await reload();
    setBusyId(null);
  };

  const isConnected = accounts.length > 0;

  return (
    <section
      className={cn(
        "rounded-[24px] border border-[#CBD5E1]/40 bg-white/90 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-[16px] bg-[#F8FAFC] text-2xl">
            {emoji}
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
              E-Mail
            </p>
            <h3 className="text-[15px] font-semibold text-[#0F172A]">{title}</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
              {description}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            isConnected
              ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/80 text-[#047857]"
              : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
          )}
        >
          {isConnected ? `${accounts.length} Account${accounts.length === 1 ? "" : "s"}` : "Nicht verbunden"}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
            <Loader2 className="size-4 animate-spin" />
            Verbindungen laden…
          </div>
        ) : accounts.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-4 py-3 text-[12px] text-[#64748B]">
            Noch kein Konto verbunden. Ein Klick — Microsoft/Google Login — fertig.
          </p>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-[#64748B]" />
                  <p className="truncate text-[13px] font-semibold text-[#0F172A]">
                    {account.accountEmail}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  {account.status === "error"
                    ? account.lastError ?? "Verbindungsfehler"
                    : `Sync: ${formatRelativeSync(account.lastSyncAt)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onSyncAccount && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId === account.id}
                    onClick={() => void handleSync(account)}
                    className="h-8 gap-1.5 rounded-[10px] text-[11px]"
                  >
                    {busyId === account.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Sync
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === account.id}
                  onClick={() => void handleDisconnect(account.id)}
                  className="h-8 gap-1.5 rounded-[10px] text-[11px] text-[#64748B]"
                >
                  <Unplug className="size-3.5" />
                  Trennen
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        type="button"
        onClick={handleConnect}
        className="mt-4 h-10 w-full gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white"
      >
        <Plus className="size-3.5" />
        {isConnected ? "Weitere verbinden" : provider === "google" ? "Mit Google verbinden" : "Outlook verbinden"}
      </Button>
    </section>
  );
}
