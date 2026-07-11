import { getGoogleOAuthConfig } from "@/features/gmail/services/google/config";
import { GOOGLE_GMAIL_SCOPES } from "@/features/gmail/services/google/oauth";
import { createGmailClient, type GmailClient } from "@/features/gmail/services/gmail/client";
import {
  IntegrationNotImplementedError,
  type MailProvider,
} from "@/features/platforms/services/integrations/provider";
import type {
  ConnectOptions,
  DisconnectOptions,
  EmailQueryOptions,
  NormalizedEmail,
  SyncOptions,
  SyncResult,
} from "@/features/platforms/services/integrations/types";

/**
 * Gmail MailProvider — erste Test-Integration für HELPY Connect.
 * Mappt Gmail API → NormalizedEmail.
 */
export class GmailService implements MailProvider {
  readonly id = "gmail" as const;
  readonly displayName = "Gmail";
  readonly capabilities = {
    mail: true,
    calendar: false,
    contacts: false,
    forms: false,
  };

  private client: GmailClient;

  constructor(client?: GmailClient) {
    this.client =
      client ??
      createGmailClient({
        ...getGoogleOAuthConfig(),
        scopes: [...GOOGLE_GMAIL_SCOPES],
      });
  }

  async connect(_options?: ConnectOptions): Promise<void> {
    throw new IntegrationNotImplementedError(this.id, "connect");
  }

  async disconnect(_options?: DisconnectOptions): Promise<void> {
    this.client.clearTokens();
  }

  async sync(_options?: SyncOptions): Promise<SyncResult> {
    throw new IntegrationNotImplementedError(this.id, "sync");
  }

  async getEmails(_options?: EmailQueryOptions): Promise<NormalizedEmail[]> {
    throw new IntegrationNotImplementedError(this.id, "getEmails");
  }

  async getEmailById(_id: string): Promise<NormalizedEmail | null> {
    throw new IntegrationNotImplementedError(this.id, "getEmailById");
  }
}

export function createGmailService(): GmailService {
  return new GmailService();
}
