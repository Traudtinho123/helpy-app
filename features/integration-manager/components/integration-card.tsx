"use client";

import { Loader2, RefreshCw, Unplug } from "lucide-react";
import { useState } from "react";
import { AppleCalendarConnectModal } from "@/features/apple-calendar/components/apple-calendar-connect-modal";
import {
  connectAppleCalendar,
  disconnectAppleCalendar,
  getAppleCalendarSyncState,
  syncAppleCalendarEvents,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  connectAppleCalendarIntegration,
  connectOutlookIntegration,
  disconnectOutlookIntegration,
  runIntegrationAction,
  updateOutlookSyncMeta,
} from "@/features/integration-manager/services/integration-manager";
import {
  disconnectOutlookConnection,
  refreshOutlookConnectionStatus,
  startOutlookConnect,
} from "@/features/outlook/services/outlook-auth-service";
import { loadOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import type {
  IntegrationAction,
  IntegrationRecord,
  IntegrationStatus,
} from "@/features/integration-manager/types/integration-types";
import {
  PlatformCard,
  PlatformCardButton,
  type PlatformCardStatus,
} from "@/features/platforms/components/platform-card";

type IntegrationCardProps = {
  integration: IntegrationRecord;
};

function mapStatus(status: IntegrationStatus): PlatformCardStatus {
  if (status === "verbindung_pruefen") return "fehler";
  return status;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const [busy, setBusy] = useState<IntegrationAction | null>(null);
  const [appleModalOpen, setAppleModalOpen] = useState(false);
  const isAppleCalendar = integration.id === "apple-calendar";
  const isOutlook = integration.id === "outlook";
  const isComingSoon = integration.status === "bald_verfuegbar";
  const isConnected = integration.connected;
  const hasError = integration.status === "fehler";

  const runAction = (action: IntegrationAction) => {
    if (isAppleCalendar && action === "disconnect") {
      disconnectAppleCalendar();
    }

    if (isOutlook && action === "disconnect") {
      void disconnectOutlookConnection().then(() => {
        disconnectOutlookIntegration();
      });
    }

    if (isOutlook && action === "sync") {
      setBusy(action);
      void loadOutlookVorgaenge().then((result) => {
        void refreshOutlookConnectionStatus().then((status) => {
          if (status.accountEmail) {
            updateOutlookSyncMeta({
              accountEmail: status.accountEmail,
              messagesToday: result.ok ? result.count : 0,
              lastSyncAt: new Date().toISOString(),
              lastError: result.ok ? null : result.error,
            });
          }
          runIntegrationAction(integration.id, action);
          setBusy(null);
        });
      });
      return;
    }

    if (isAppleCalendar && action === "sync") {
      setBusy(action);
      void syncAppleCalendarEvents().then(() => {
        const state = getAppleCalendarSyncState();
        if (state.connection.appleIdEmail) {
          connectAppleCalendarIntegration({
            accountEmail: state.connection.appleIdEmail,
            calendarName: state.connection.calendarName ?? "iCloud Kalender",
            eventsToday: state.events.length,
          });
        }
        runIntegrationAction(integration.id, action);
        setBusy(null);
      });
      return;
    }

    setBusy(action);
    runIntegrationAction(integration.id, action);
    setBusy(null);
  };

  const handleConnectClick = () => {
    if (isAppleCalendar) {
      setAppleModalOpen(true);
      return;
    }

    if (isOutlook) {
      startOutlookConnect();
      return;
    }

    if (integration.id === "gmail") {
      window.location.href = "/api/oauth/google/start";
      return;
    }

    runAction("connect");
  };

  const handleAppleConnect = async (input: {
    appleIdEmail: string;
    appSpecificPassword: string;
    calendarId: string;
  }) => {
    const result = await connectAppleCalendar(input);

    if (result.success) {
      const state = getAppleCalendarSyncState();

      connectAppleCalendarIntegration({
        accountEmail: input.appleIdEmail,
        calendarName: state.connection.calendarName ?? "iCloud Kalender",
        eventsToday: state.events.length,
      });
    }

    return result;
  };

  return (
    <>
      <PlatformCard
        emoji={integration.emoji}
        name={integration.name}
        description={integration.description}
        status={mapStatus(integration.status)}
        account={integration.accountEmail}
        lastSync={integration.lastSync}
        eventsToday={integration.eventsToday}
        errorMessage={integration.errorMessage}
        actions={
          isComingSoon ? (
            <PlatformCardButton variant="disabled">Bald verfügbar</PlatformCardButton>
          ) : !isConnected && !hasError ? (
            <PlatformCardButton onClick={handleConnectClick} disabled={busy === "connect"}>
              {busy === "connect" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Verbinden"
              )}
            </PlatformCardButton>
          ) : hasError ? (
            <>
              <PlatformCardButton onClick={() => runAction("reconnect")}>
                Neu verbinden
              </PlatformCardButton>
              <PlatformCardButton variant="outline" onClick={() => runAction("disconnect")}>
                Trennen
              </PlatformCardButton>
            </>
          ) : (
            <>
              <PlatformCardButton
                onClick={() => runAction("sync")}
                disabled={busy === "sync"}
              >
                {busy === "sync" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Synchronisieren
              </PlatformCardButton>
              <PlatformCardButton variant="outline" onClick={() => runAction("disconnect")}>
                <Unplug className="size-3.5" />
                Trennen
              </PlatformCardButton>
            </>
          )
        }
      />

      {isAppleCalendar && (
        <AppleCalendarConnectModal
          open={appleModalOpen}
          onClose={() => setAppleModalOpen(false)}
          onConnect={handleAppleConnect}
        />
      )}
    </>
  );
}
