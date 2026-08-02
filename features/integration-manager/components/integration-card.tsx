"use client";

import { Loader2, Unplug } from "lucide-react";
import { useState } from "react";
import { AppleCalendarConnectModal } from "@/features/apple-calendar/components/apple-calendar-connect-modal";
import {
  connectAppleCalendar,
  disconnectAppleCalendar,
  getAppleCalendarSyncState,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  connectAppleCalendarIntegration,
  connectOutlookIntegration,
  disconnectOutlookIntegration,
  runIntegrationAction,
} from "@/features/integration-manager/services/integration-manager";
import {
  disconnectOutlookConnection,
  startOutlookConnect,
} from "@/features/outlook/services/outlook-auth-service";
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
import { resolvePlatformBrand } from "@/features/platforms/components/platform-brand-logo";

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
      window.location.href =
        "/api/oauth/google/start?returnTo=/plattformen";
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
        brand={resolvePlatformBrand(integration.id)}
        name={integration.name}
        description={integration.description}
        status={mapStatus(integration.status)}
        account={integration.accountEmail}
        errorMessage={integration.errorMessage}
        actions={
          isComingSoon ? (
            <PlatformCardButton variant="disabled">Bald verfügbar</PlatformCardButton>
          ) : !isConnected && !hasError ? (
            <PlatformCardButton onClick={handleConnectClick} disabled={busy === "connect"}>
              {busy === "connect" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Jetzt verbinden →"
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
            <PlatformCardButton variant="outline" onClick={() => runAction("disconnect")}>
              {busy === "disconnect" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Unplug className="size-3.5" />
              )}
              Trennen
            </PlatformCardButton>
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
