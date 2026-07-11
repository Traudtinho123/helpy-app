"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PhoneCall } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getAllRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { VoiceTwilioSetupSection } from "@/features/voice/components/voice-twilio-setup-section";
import {
  fetchVoiceOverview,
  fetchVoiceSettings,
  syncVoicePortfolioObjects,
  type VoiceOverviewPayload,
} from "@/features/voice/services/voice-settings-client";
import type { VoiceSettings } from "@/features/voice/types/voice-types";
import { cn } from "@/lib/utils";

const INTENT_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#64748B"];

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs} Sek`;
  return `${mins} Min ${secs} Sek`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="helpy-glass-card rounded-[16px] px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-[26px] font-extrabold leading-none text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export function VoiceOverviewPanel() {
  const [overview, setOverview] = useState<VoiceOverviewPayload | null>(null);
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    const activeObjects = getAllRealEstateObjects()
      .filter((object) => object.status === "aktiv")
      .slice(0, 5)
      .map((object) => ({
        objectId: object.objectId,
        titel: object.titel,
        adresse: object.adresse,
        ort: object.ort,
        zimmer: object.zimmer,
        preis: object.preis,
        status: object.status,
      }));

    await syncVoicePortfolioObjects(activeObjects);

    const [overviewResult, settingsResult] = await Promise.all([
      fetchVoiceOverview(),
      fetchVoiceSettings(),
    ]);
    setOverview(overviewResult);
    setSettings(settingsResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 30_000);
    return () => window.clearInterval(timer);
  }, [reload]);

  if (loading && !overview) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
        <Loader2 className="size-4 animate-spin" />
        Übersicht laden…
      </div>
    );
  }

  const intentChartData =
    overview?.intentStats.map((item) => ({
      name: item.label,
      value: item.count,
    })) ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Verbundene Nummern
        </h2>
        <div className="mt-4 space-y-3">
          {overview?.numbers.length ? (
            overview.numbers.map((number) => (
              <article
                key={number.phoneNumber}
                className="helpy-glass-card rounded-[20px] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
                      {number.phoneNumberDisplay}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 font-semibold text-[#334155]">
                        <PhoneCall className="size-3" />
                        {number.providerLabel}
                      </span>
                      <span>Firma: {number.companyName}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                      Verbunden seit: {formatDate(number.connectedSince)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
                        number.active
                          ? "bg-[var(--success-light)] text-[var(--success)]"
                          : "bg-[var(--warning-light)] text-[var(--warning)]"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          number.active ? "bg-[var(--success)]" : "bg-[var(--warning)]"
                        )}
                      />
                      {number.active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatTile label="Anrufe heute" value={number.stats.today} />
                  <StatTile label="Diese Woche" value={number.stats.thisWeek} />
                  <StatTile label="Gesamt" value={number.stats.total} />
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[var(--card-border)] bg-[var(--background-secondary)]/50 px-6 py-10 text-center text-[13px] text-[var(--text-secondary)]">
              Noch keine Twilio-Nummer verbunden.
            </div>
          )}
        </div>

        {settings && !overview?.connection.ready ? (
          <div className="mt-4">
            <VoiceTwilioSetupSection
              settings={settings}
              onSettingsChange={(next) => {
                setSettings(next);
                void reload();
              }}
            />
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Statistiken
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Anrufe heute" value={overview?.stats.today ?? 0} />
          <StatTile label="Anrufe diese Woche" value={overview?.stats.thisWeek ?? 0} />
          <StatTile
            label="Ø Gesprächsdauer"
            value={formatDuration(overview?.stats.avgDurationSeconds ?? 0)}
          />
          <StatTile label="Gesamt (letzte 200)" value={overview?.stats.total ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Häufigste Anliegen
        </h2>
        <div className="helpy-glass-card mt-4 rounded-[20px] p-5">
          {intentChartData.length > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {intentChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={INTENT_COLORS[index % INTENT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] text-[var(--text-secondary)]">
                {intentChartData.map((item, index) => (
                  <li key={item.name} className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: INTENT_COLORS[index % INTENT_COLORS.length],
                      }}
                    />
                    {item.name} ({item.value})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-[var(--text-secondary)]">
              Noch keine Anrufdaten für die Auswertung.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
