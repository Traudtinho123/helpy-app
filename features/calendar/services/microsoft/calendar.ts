import {
  IntegrationNotImplementedError,
  type CalendarProvider,
} from "@/features/platforms/services/integrations/provider";
import { OUTLOOK_CALENDAR_SCOPES } from "@/features/calendar/services/microsoft/types";
import type {
  CalendarQueryOptions,
  ConnectOptions,
  CreateEventInput,
  DisconnectOptions,
  NormalizedCalendarEvent,
  SyncOptions,
  SyncResult,
} from "@/features/platforms/services/integrations/types";

/**
 * Outlook / Microsoft 365 Kalender — Microsoft Graph (geplant).
 */
export class OutlookCalendarService implements CalendarProvider {
  readonly id = "outlook" as const;
  readonly displayName = "Outlook Kalender";
  readonly capabilities = {
    mail: false,
    calendar: true,
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

  async getEvents(
    _options?: CalendarQueryOptions
  ): Promise<NormalizedCalendarEvent[]> {
    throw new IntegrationNotImplementedError(this.id, "getEvents");
  }

  async createEvent(
    _input: CreateEventInput
  ): Promise<NormalizedCalendarEvent> {
    throw new IntegrationNotImplementedError(this.id, "createEvent");
  }
}

export class Microsoft365CalendarService implements CalendarProvider {
  readonly id = "microsoft-365" as const;
  readonly displayName = "Microsoft 365 Kalender";
  readonly capabilities = {
    mail: false,
    calendar: true,
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

  async getEvents(
    _options?: CalendarQueryOptions
  ): Promise<NormalizedCalendarEvent[]> {
    throw new IntegrationNotImplementedError(this.id, "getEvents");
  }

  async createEvent(
    _input: CreateEventInput
  ): Promise<NormalizedCalendarEvent> {
    throw new IntegrationNotImplementedError(this.id, "createEvent");
  }
}

export function createOutlookCalendarService(): OutlookCalendarService {
  return new OutlookCalendarService();
}

export function createMicrosoft365CalendarService(): Microsoft365CalendarService {
  return new Microsoft365CalendarService();
}

export { OUTLOOK_CALENDAR_SCOPES };
