import {
  isCalendarProvider,
  isContactProvider,
  isFormProvider,
  isMailProvider,
  type CalendarProvider,
  type ContactProvider,
  type FormProvider,
  type MailProvider,
} from "@/features/platforms/services/integrations/provider";
import { createFormsService } from "@/features/platforms/services/integrations/forms/service";
import { createGmailService } from "@/features/gmail/services/gmail/service";
import {
  createMicrosoft365CalendarService,
  createOutlookCalendarService,
} from "@/features/calendar/services/microsoft/calendar";
import {
  createMicrosoft365MailService,
  createOutlookContactService,
  createOutlookMailService,
} from "@/features/gmail/services/microsoft/outlook";
import type {
  ConnectOptions,
  DisconnectOptions,
  IntegrationConnection,
  IntegrationProviderId,
  SyncOptions,
} from "@/features/platforms/services/integrations/types";

type RegisteredProvider =
  | MailProvider
  | CalendarProvider
  | FormProvider
  | ContactProvider;

/**
 * Zentraler Orchestrator für HELPY Connect.
 * UI, Brain und Intake importieren ausschließlich diese Schicht.
 */
export class HelpyConnect {
  private mailProviders = new Map<IntegrationProviderId, MailProvider>();
  private calendarProviders = new Map<
    IntegrationProviderId,
    CalendarProvider
  >();
  private formProviders = new Map<IntegrationProviderId, FormProvider>();
  private contactProviders = new Map<IntegrationProviderId, ContactProvider>();
  private connections = new Map<IntegrationProviderId, IntegrationConnection>();

  register(provider: RegisteredProvider): void {
    if (isMailProvider(provider)) {
      this.mailProviders.set(provider.id, provider);
    }
    if (isCalendarProvider(provider)) {
      this.calendarProviders.set(provider.id, provider);
    }
    if (isFormProvider(provider)) {
      this.formProviders.set(provider.id, provider);
    }
    if (isContactProvider(provider)) {
      this.contactProviders.set(provider.id, provider);
    }

    if (!this.connections.has(provider.id)) {
      this.connections.set(provider.id, {
        providerId: provider.id,
        status: "disconnected",
      });
    }
  }

  /** Registriert alle bekannten Provider-Stubs (Gmail, Outlook, M365 …). */
  registerDefaults(): void {
    this.register(createGmailService());
    this.register(createFormsService());
    this.register(createOutlookMailService());
    this.register(createMicrosoft365MailService());
    this.register(createOutlookCalendarService());
    this.register(createMicrosoft365CalendarService());
    this.register(createOutlookContactService());
  }

  getMailProvider(id: IntegrationProviderId): MailProvider | undefined {
    return this.mailProviders.get(id);
  }

  getCalendarProvider(id: IntegrationProviderId): CalendarProvider | undefined {
    return this.calendarProviders.get(id);
  }

  getFormProvider(id: IntegrationProviderId): FormProvider | undefined {
    return this.formProviders.get(id);
  }

  getContactProvider(id: IntegrationProviderId): ContactProvider | undefined {
    return this.contactProviders.get(id);
  }

  getConnection(id: IntegrationProviderId): IntegrationConnection | undefined {
    return this.connections.get(id);
  }

  getAllConnections(): IntegrationConnection[] {
    return Array.from(this.connections.values());
  }

  async connectMail(
    id: IntegrationProviderId,
    options?: ConnectOptions
  ): Promise<IntegrationConnection> {
    const provider = this.mailProviders.get(id);
    if (!provider) {
      throw new Error(`Mail-Provider "${id}" ist nicht registriert.`);
    }
    return this.runConnect(id, () => provider.connect(options));
  }

  async connectCalendar(
    id: IntegrationProviderId,
    options?: ConnectOptions
  ): Promise<IntegrationConnection> {
    const provider = this.calendarProviders.get(id);
    if (!provider) {
      throw new Error(`Kalender-Provider "${id}" ist nicht registriert.`);
    }
    return this.runConnect(id, () => provider.connect(options));
  }

  async disconnectMail(
    id: IntegrationProviderId,
    options?: DisconnectOptions
  ): Promise<void> {
    const provider = this.mailProviders.get(id);
    if (!provider) return;
    await provider.disconnect(options);
    this.connections.set(id, { providerId: id, status: "disconnected" });
  }

  async syncMail(
    id: IntegrationProviderId,
    options?: SyncOptions
  ): Promise<void> {
    const provider = this.mailProviders.get(id);
    if (!provider) {
      throw new Error(`Mail-Provider "${id}" ist nicht registriert.`);
    }
    await this.runSync(id, () => provider.sync(options));
  }

  private async runConnect(
    id: IntegrationProviderId,
    fn: () => Promise<void>
  ): Promise<IntegrationConnection> {
    this.patchConnection(id, { status: "connecting" });
    try {
      await fn();
      const connection: IntegrationConnection = {
        providerId: id,
        status: "connected",
        connectedAt: new Date().toISOString(),
      };
      this.connections.set(id, connection);
      return connection;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verbindung fehlgeschlagen";
      this.patchConnection(id, { status: "error", errorMessage: message });
      throw error;
    }
  }

  private async runSync(
    id: IntegrationProviderId,
    fn: () => Promise<import("@/features/platforms/services/integrations/types").SyncResult>
  ): Promise<void> {
    this.patchConnection(id, { status: "syncing" });
    try {
      const result = await fn();
      this.patchConnection(id, {
        status: "connected",
        lastSyncAt: result.syncedAt,
        errorMessage: result.success ? undefined : result.errorMessage,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Synchronisation fehlgeschlagen";
      this.patchConnection(id, { status: "error", errorMessage: message });
      throw error;
    }
  }

  private patchConnection(
    id: IntegrationProviderId,
    patch: Partial<IntegrationConnection>
  ): void {
    const current = this.connections.get(id) ?? {
      providerId: id,
      status: "disconnected" as const,
    };
    this.connections.set(id, { ...current, ...patch });
  }
}

export const helpyConnect = new HelpyConnect();
