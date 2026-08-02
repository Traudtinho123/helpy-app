"use client";

import { Loader2, Unplug } from "lucide-react";
import { useState } from "react";
import { AppleCalendarConnectModal } from "@/features/apple-calendar/components/apple-calendar-connect-modal";
import {
  connectAppleCalendar,
  getAppleCalendarServerSnapshot,
  getAppleCalendarSyncState,
  subscribeAppleCalendarSync,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  connectAppleCalendarPlatform,
  disconnectCalendarPlatform,
  getConnectedCalendarPlatform,
  subscribeCalendarPlatform,
} from "@/features/calendar/services/calendar-platform";
import {
  PlatformCard,
  PlatformCardButton,
} from "@/features/platforms/components/platform-card";
import { useSyncExternalStore } from "react";

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

  const googleConnected = platform === "google";
  const appleConnected = platform === "apple";

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

  return (
    <>
      <PlatformCard
        brand="google-calendar"
        name="Google Kalender"
        description="Termine aus Google Workspace und Android in HELPY einbinden."
        status={googleConnected ? "verbunden" : "nicht_verbunden"}
        account={googleConnected ? "Google-Konto verbunden" : null}
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
                window.location.href =
                  "/api/oauth/google/start?returnTo=/plattformen";
              }}
              disabled={busyPlatform === "google"}
            >
              {busyPlatform === "google" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Jetzt verbinden →"
              )}
            </PlatformCardButton>
          )
        }
      />

      <PlatformCard
        brand="apple-calendar"
        name="Apple Kalender"
        description="Termine von iPhone und iCloud in HELPY einbinden."
        status={appleConnected ? "verbunden" : "nicht_verbunden"}
        account={appleState.connection.appleIdEmail}
        errorMessage={appleState.connection.errorMessage}
        actions={
          appleConnected ? (
            <PlatformCardButton
              variant="outline"
              onClick={() => {
                setBusyPlatform("apple");
                disconnectCalendarPlatform("apple");
                setBusyPlatform(null);
              }}
              disabled={busyPlatform === "apple"}
            >
              {busyPlatform === "apple" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Unplug className="size-3.5" />
              )}
              Trennen
            </PlatformCardButton>
          ) : (
            <PlatformCardButton onClick={() => setAppleModalOpen(true)}>
              Jetzt verbinden →
            </PlatformCardButton>
          )
        }
      />

      <PlatformCard
        brand="outlook"
        name="Outlook Kalender"
        description="Outlook-Termine mit HELPY verbinden."
        status="bald_verfuegbar"
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
