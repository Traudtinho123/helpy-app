"use client";

import { IntegrationCard } from "@/features/integration-manager/components/integration-card";
import {
  CALENDAR_PLATFORM_INTEGRATION_IDS,
  EMAIL_OAUTH_INTEGRATION_IDS,
  INTEGRATION_CATEGORY_LABELS,
  PLATFORM_CATEGORY_ORDER,
} from "@/features/integration-manager/types/integration-categories";
import type {
  IntegrationCategory,
  IntegrationRecord,
} from "@/features/integration-manager/types/integration-types";
import { CalendarPlatformCards } from "@/features/platforms/components/calendar-platform-cards";
import { MailPlatformCard } from "@/features/platforms/components/mail-platform-card";
import { loadOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";

type IntegrationGridProps = {
  byCategory: Map<IntegrationCategory, IntegrationRecord[]>;
};

const PLATFORM_GRID_CLASS =
  "grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3";

function PlatformSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-[12px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
        {title}
      </h2>
      <div className={PLATFORM_GRID_CLASS}>{children}</div>
    </section>
  );
}

export function IntegrationGrid({ byCategory }: IntegrationGridProps) {
  return (
    <div className="space-y-10">
      {PLATFORM_CATEGORY_ORDER.map((category) => {
        if (category === "email") {
          return (
            <PlatformSection key={category} title={INTEGRATION_CATEGORY_LABELS.email}>
              <MailPlatformCard
                provider="google"
                name="Gmail"
                emoji="📧"
                description="E-Mails erkennen und als Vorgänge vorbereiten."
                onSyncAccount={async () => {
                  const payload = await syncGmailViaOAuthApi();
                  if (payload.ok) {
                    await syncGmailVorgaengeFromOAuthAccounts(payload.accounts);
                  }
                }}
              />
              <MailPlatformCard
                provider="microsoft"
                name="Outlook / Microsoft 365"
                emoji="📨"
                description="Outlook-Postfächer verbinden und Eingänge synchronisieren."
                onSyncAccount={async () => {
                  await loadOutlookVorgaenge();
                }}
              />
            </PlatformSection>
          );
        }

        if (category === "kalender") {
          return (
            <PlatformSection key={category} title={INTEGRATION_CATEGORY_LABELS.kalender}>
              <CalendarPlatformCards />
            </PlatformSection>
          );
        }

        const items =
          byCategory.get(category)?.filter(
            (integration) =>
              !EMAIL_OAUTH_INTEGRATION_IDS.has(integration.id) &&
              !CALENDAR_PLATFORM_INTEGRATION_IDS.has(integration.id)
          ) ?? [];

        if (!items.length) return null;

        return (
          <PlatformSection
            key={category}
            title={INTEGRATION_CATEGORY_LABELS[category]}
          >
            {items.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </PlatformSection>
        );
      })}
    </div>
  );
}
