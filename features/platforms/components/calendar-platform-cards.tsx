"use client";

import { Loader2, RefreshCw, Unplug } from "lucide-react";
import { useState } from "react";
import { AppleCalendarConnectModal } from "@/features/apple-calendar/components/apple-calendar-connect-modal";
import {
  connectAppleCalendar,
  formatAppleCalendarLastSync,
  getAppleCalendarServerSnapshot,
  getAppleCalendarSyncState,
  subscribeAppleCalendarSync,
  syncAppleCalendarEvents,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import { getZurichDateString } from "@/features/apple-calendar/services/apple-caldav-timezone";
import {
  connectAppleCalendarPlatform,
  connectGoogleCalendarPlatform,
  disconnectCalendarPlatform,
  getConnectedCalendarPlatform,
  subscribeCalendarPlatform,
} from "@/features/calendar/services/calendar-platform";
import { getIntegrationById } from "@/features/integration-manager/services/integration-manager";
import {
  PlatformCard,
  PlatformCardButton,
} from "@/features/platforms/components/platform-card";
import { useEffect, useSyncExternalStore } from "react";

export function CalendarPlatformCards() {
  const platform = useSyncExternalStore(
    subscribeCalendarPlatform,
    getConnectedCalendarPlatform,
    () => null
  );
  const appleState = useSyncExternalStore(
    subscribeAppleCalendarSync,
    getAppleCalendarSyncState,
    getAppleCalendarServerSnapshot
  );
  const [busyPlatform, setBusyPlatform] = useState<"google" | "apple" | null>(
    null
  );
  const [appleModalOpen, setAppleModalOpen] = useState(false);

  useEffect(() => {
    if (platform !== "apple") return;
    void syncAppleCalendarEvents();
  }, [platform]);

  const appleIntegration = getIntegrationById("apple-calendar");
  const todayAppleEvents = appleState.events.filter(
    (event) => event.date === getZurichDateString()
  ).length;

  const handleAppleConnect = async (input: {
    appleIdEmail: string;
    appSpecificPassword: string;
    calendarId: string;
  }) => {
    setBusyPlatform("apple");
    const result = await connectAppleCalendar(input);

    if (result.success) {
      connectAppleCalendarPlatform({
        accountEmail: input.appleIdEmail,
        calendarName:
          getAppleCalendarSyncState().connection.calendarName ?? "Apple Kalender",
        eventsToday: getAppleCalendarSyncState().events.length,
      });
    }

    setBusyPlatform(null);
    return result;
  };

  const googleConnected = platform === "google";
  const appleConnected = platform === "apple";

  return (
    <>
      <PlatformCard
        emoji="📅"
        name="Google Kalender"
        description="Termine aus Google Workspace und Android synchronisieren."
        status={googleConnected ? "verbunden" : "nicht_verbunden"}
        account={googleConnected ? "Google-Konto" : "—"}
        lastSync="—"
        eventsToday={googleConnected ? 0 : null}
        actions={
          googleConnected ? (
            <PlatformCardButton
              variant="outline"
              onClick={() => {
                setBusyPlatform("google");
                disconnectCalendarPlatform("google");
                setBusyPlatform(null);
              }}
              disabled={busyPlatform === "google"}
            >
              {busyPlatform === "google" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Unplug className="size-3.5" />
              )}
              Trennen
            </PlatformCardButton>
          ) : (
            <PlatformCardButton
              onClick={() => {
                setBusyPlatform("google");
                connectGoogleCalendarPlatform();
                setBusyPlatform(null);
              }}
              disabled={busyPlatform === "google"}
            >
              {busyPlatform === "google" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Verbinden"
              )}
            </PlatformCardButton>
          )
        }
      />

      <PlatformCard
        emoji="🍎"
        name="Apple Kalender"
        description="Termine von iPhone und iCloud in HELPY einbinden."
        status={appleConnected ? "verbunden" : "nicht_verbunden"}
        account={appleState.connection.appleIdEmail ?? "—"}
        lastSync={
          appleConnected
            ? formatAppleCalendarLastSync(appleState.connection.lastSyncAt)
            : "—"
        }
        eventsToday={
          appleConnected
            ? appleIntegration?.eventsToday ?? todayAppleEvents
            : null
        }
        errorMessage={appleState.connection.errorMessage}
        actions={
          appleConnected ? (
            <>
              <PlatformCardButton
                onClick={() => {
                  setBusyPlatform("apple");
                  void syncAppleCalendarEvents().finally(() =>
                    setBusyPlatform(null)
                  );
                }}
                disabled={busyPlatform === "apple"}
              >
                {busyPlatform === "apple" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Synchronisieren
              </PlatformCardButton>
              <PlatformCardButton
                variant="outline"
                onClick={() => {
                  setBusyPlatform("apple");
                  disconnectCalendarPlatform("apple");
                  setBusyPlatform(null);
                }}
                disabled={busyPlatform === "apple"}
              >
                <Unplug className="size-3.5" />
                Trennen
              </PlatformCardButton>
            </>
          ) : (
            <PlatformCardButton onClick={() => setAppleModalOpen(true)}>
              Verbinden
            </PlatformCardButton>
          )
        }
      />

      <PlatformCard
        emoji="📅"
        name="Outlook Kalender"
        description="Outlook-Termine mit HELPY synchronisieren."
        status="bald_verfuegbar"
        account="—"
        lastSync="—"
        eventsToday={null}
        actions={<PlatformCardButton variant="disabled">Bald verfügbar</PlatformCardButton>}
      />

      <AppleCalendarConnectModal
        open={appleModalOpen}
        onClose={() => setAppleModalOpen(false)}
        onConnect={handleAppleConnect}
      />
    </>
  );
}
