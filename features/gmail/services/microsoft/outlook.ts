import {
  IntegrationNotImplementedError,
  type ContactProvider,
  type MailProvider,
} from "@/features/platforms/services/integrations/provider";
import {
  getMicrosoftOAuthConfig,
  type MicrosoftGraphTokens,
  OUTLOOK_MAIL_SCOPES,
} from "@/features/calendar/services/microsoft/types";
import type {
  ConnectOptions,
  ContactQueryOptions,
  DisconnectOptions,
  EmailQueryOptions,
  NormalizedContact,
  NormalizedEmail,
  SyncOptions,
  SyncResult,
} from "@/features/platforms/services/integrations/types";

/**
 * Outlook Mail — Microsoft Graph (geplant).
 * Gleiche MailProvider-Schnittstelle wie Gmail.
 */
export class OutlookMailService implements MailProvider {
  readonly id = "outlook" as const;
  readonly displayName = "Outlook";
  readonly capabilities = {
    mail: true,
    calendar: false,
    contacts: false,
    forms: false,
  };

  private tokens: MicrosoftGraphTokens = {};

  async connect(_options?: ConnectOptions): Promise<void> {
    throw new IntegrationNotImplementedError(this.id, "connect");
  }

  async disconnect(_options?: DisconnectOptions): Promise<void> {
    this.tokens = {};
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

/** Microsoft 365 Mail — erweitert Outlook um Unternehmenskontext. */
export class Microsoft365MailService implements MailProvider {
  readonly id = "microsoft-365" as const;
  readonly displayName = "Microsoft 365";
  readonly capabilities = {
    mail: true,
    calendar: false,
    contacts: false,
    forms: false,
  };

  async connect(_options?: ConnectOptions): Promise<void> {
    throw new IntegrationNotImplementedError(this.id, "connect");
  }

  async disconnect(_options?: DisconnectOptions): Promise<void> {
    return;
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

/** Outlook / Microsoft 365 Kontakte. */
export class OutlookContactService implements ContactProvider {
  readonly id = "outlook" as const;
  readonly displayName = "Outlook Kontakte";

  async getContacts(
    _options?: ContactQueryOptions
  ): Promise<NormalizedContact[]> {
    throw new IntegrationNotImplementedError(this.id, "getContacts");
  }
}

export function createOutlookMailService(): OutlookMailService {
  return new OutlookMailService();
}

export function createMicrosoft365MailService(): Microsoft365MailService {
  return new Microsoft365MailService();
}

export function createOutlookContactService(): OutlookContactService {
  return new OutlookContactService();
}

export { getMicrosoftOAuthConfig, OUTLOOK_MAIL_SCOPES };
