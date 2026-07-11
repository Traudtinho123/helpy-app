"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  connectAppleCalendar,
  disconnectAppleCalendar,
  getAppleCalendarServerSnapshot,
  getAppleCalendarSyncState,
  subscribeAppleCalendarSync,
  syncAppleCalendarEvents,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import type { AppleCalendarConnectInput } from "@/features/apple-calendar/types/apple-calendar-types";

export function useAppleCalendarSync() {
  const state = useSyncExternalStore(
    subscribeAppleCalendarSync,
    getAppleCalendarSyncState,
    getAppleCalendarServerSnapshot
  );

  const connect = useCallback(async (input: AppleCalendarConnectInput) => {
    return connectAppleCalendar(input);
  }, []);

  const disconnect = useCallback(() => {
    disconnectAppleCalendar();
  }, []);

  const sync = useCallback(async () => {
    await syncAppleCalendarEvents();
  }, []);

  return {
    connection: state.connection,
    events: state.events,
    isConnected: state.connection.status === "connected",
    isConnecting: state.connection.status === "connecting",
    isSyncing: state.connection.status === "syncing",
    connect,
    disconnect,
    sync,
  };
}
