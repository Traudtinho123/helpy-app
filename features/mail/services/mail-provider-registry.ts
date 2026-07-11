import type { MailProviderId } from "@/features/mail/types/unified-mail-types";

export type MailProviderDefinition = {
  id: MailProviderId;
  label: string;
  quelleLabel: string;
};

export const MAIL_PROVIDER_REGISTRY: Record<MailProviderId, MailProviderDefinition> =
  {
    gmail: {
      id: "gmail",
      label: "Gmail",
      quelleLabel: "Gmail",
    },
    outlook: {
      id: "outlook",
      label: "Outlook",
      quelleLabel: "Outlook",
    },
  };

export const MAIL_PROVIDER_IDS = Object.keys(
  MAIL_PROVIDER_REGISTRY
) as MailProviderId[];

export function getMailProviderDefinition(
  provider: MailProviderId
): MailProviderDefinition {
  return MAIL_PROVIDER_REGISTRY[provider];
}

export function getMailProviderLabel(provider: MailProviderId): string {
  return MAIL_PROVIDER_REGISTRY[provider].label;
}

export function resolveMailProviderFromVorgang(input: {
  mailProvider?: MailProviderId;
  quelle?: string;
  id?: string;
}): MailProviderId {
  if (input.mailProvider) return input.mailProvider;
  if (input.quelle === "Outlook" || input.id?.startsWith("brain-v3-outlook-")) {
    return "outlook";
  }
  return "gmail";
}
