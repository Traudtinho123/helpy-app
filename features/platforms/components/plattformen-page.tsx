"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { IntegrationGrid } from "@/features/integration-manager/components/integration-grid";
import {
  connectOutlookIntegration,
  getIntegrationsByCategory,
  subscribeIntegrations,
  updateOutlookSyncMeta,
} from "@/features/integration-manager/services/integration-manager";
import { reconcileCalendarPlatformState } from "@/features/calendar/services/calendar-platform";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { loadOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import {
  getAppleCalendarSyncState,
  isAppleCalendarConnected,
  syncAppleCalendarEvents,
} from "@/features/apple-calendar/services/apple-calendar-sync";

function PlattformenContent() {
  const [, setTick] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => subscribeIntegrations(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    const oauthState = searchParams.get("oauth");
    const provider = searchParams.get("provider");
    const legacyOutlook = searchParams.get("outlook");

    if (oauthState === "connected" && provider === "microsoft") {
      void refreshOutlookConnectionStatus().then(async (status) => {
        if (status.status === "connected" && status.accountEmail) {
          const syncResult = await loadOutlookVorgaenge();
          connectOutlookIntegration({
            accountEmail: status.accountEmail!,
            messagesToday: syncResult.ok ? syncResult.count : 0,
          });
          updateOutlookSyncMeta({
            accountEmail: status.accountEmail,
            messagesToday: syncResult.ok ? syncResult.count : 0,
            lastSyncAt: new Date().toISOString(),
            lastError: syncResult.ok ? null : syncResult.error,
          });
        }
      });
      return;
    }

    if (!legacyOutlook) return;

    void refreshOutlookConnectionStatus().then(async (status) => {
      if (legacyOutlook === "connected" && status.status === "connected" && status.accountEmail) {
        const syncResult = await loadOutlookVorgaenge();
        connectOutlookIntegration({
          accountEmail: status.accountEmail!,
          messagesToday: syncResult.ok ? syncResult.count : 0,
        });
        updateOutlookSyncMeta({
          accountEmail: status.accountEmail,
          messagesToday: syncResult.ok ? syncResult.count : 0,
          lastSyncAt: new Date().toISOString(),
          lastError: syncResult.ok ? null : syncResult.error,
        });
      }
    });
  }, [searchParams]);

  useEffect(() => {
    reconcileCalendarPlatformState();

    if (!isAppleCalendarConnected()) return;

    const state = getAppleCalendarSyncState();
    if (!state.connection.appleIdEmail) return;

    if (state.events.length === 0) {
      void syncAppleCalendarEvents();
    }
  }, []);

  const byCategory = getIntegrationsByCategory();

  return (
    <div className="mx-auto max-w-6xl px-8 py-12 lg:px-12 lg:py-14">
      <header className="mb-10">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
          Verbindungen
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A] lg:text-[2.25rem]">
          Plattformen
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
          Alle Anbindungen an einem Ort — einheitlich verwalten und verbinden.
        </p>
      </header>

      <IntegrationGrid byCategory={byCategory} />
    </div>
  );
}

export function PlattformenPage() {
  return (
    <DashboardShell activeHref="/plattformen">
      <Suspense fallback={null}>
        <PlattformenContent />
      </Suspense>
    </DashboardShell>
  );
}
