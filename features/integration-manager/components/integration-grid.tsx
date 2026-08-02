"use client";

import { IntegrationCard } from "@/features/integration-manager/components/integration-card";
import {
  CALENDAR_PLATFORM_INTEGRATION_IDS,
  EMAIL_OAUTH_INTEGRATION_IDS,
  INTEGRATION_CATEGORY_LABELS,
  PLATFORM_CATEGORY_ORDER,
  SOCIAL_PLATFORM_INTEGRATION_IDS,
} from "@/features/integration-manager/types/integration-categories";
import type {
  IntegrationCategory,
  IntegrationRecord,
} from "@/features/integration-manager/types/integration-types";
import { CalendarPlatformCards } from "@/features/platforms/components/calendar-platform-cards";
import { MailPlatformCard } from "@/features/platforms/components/mail-platform-card";
import { SocialPlatformCards } from "@/features/platforms/components/social-platform-cards";

type IntegrationGridProps = {
  byCategory: Map<IntegrationCategory, IntegrationRecord[]>;
};

const PLATFORM_GRID_CLASS =
  "grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3";

function PlatformSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
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
                description="E-Mails erkennen und als Vorgänge vorbereiten."
              />
              <MailPlatformCard
                provider="microsoft"
                name="Outlook / Microsoft 365"
                description="Outlook-Postfächer verbinden und Eingänge synchronisieren."
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

        if (category === "sozial-media") {
          return (
            <PlatformSection
              key={category}
              title={INTEGRATION_CATEGORY_LABELS["sozial-media"]}
            >
              <SocialPlatformCards />
            </PlatformSection>
          );
        }

        const items =
          byCategory.get(category)?.filter(
            (integration) =>
              !EMAIL_OAUTH_INTEGRATION_IDS.has(integration.id) &&
              !CALENDAR_PLATFORM_INTEGRATION_IDS.has(integration.id) &&
              !SOCIAL_PLATFORM_INTEGRATION_IDS.has(integration.id)
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
