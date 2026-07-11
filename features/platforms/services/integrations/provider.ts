import type {
  CalendarQueryOptions,
  ConnectOptions,
  ContactQueryOptions,
  CreateEventInput,
  DisconnectOptions,
  EmailQueryOptions,
  FormQueryOptions,
  FormSubmission,
  IntegrationProviderId,
  NormalizedCalendarEvent,
  NormalizedContact,
  NormalizedEmail,
  ProviderCapabilities,
  SyncOptions,
  SyncResult,
} from "@/features/platforms/services/integrations/types";

export interface MailProvider {
  readonly id: IntegrationProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;

  connect(options?: ConnectOptions): Promise<void>;
  disconnect(options?: DisconnectOptions): Promise<void>;
  sync(options?: SyncOptions): Promise<SyncResult>;
  getEmails(options?: EmailQueryOptions): Promise<NormalizedEmail[]>;
  getEmailById(id: string): Promise<NormalizedEmail | null>;
}

export interface CalendarProvider {
  readonly id: IntegrationProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;

  connect(options?: ConnectOptions): Promise<void>;
  disconnect(options?: DisconnectOptions): Promise<void>;
  sync(options?: SyncOptions): Promise<SyncResult>;
  getEvents(options?: CalendarQueryOptions): Promise<NormalizedCalendarEvent[]>;
  createEvent(input: CreateEventInput): Promise<NormalizedCalendarEvent>;
}

export interface FormProvider {
  readonly id: IntegrationProviderId;
  readonly displayName: string;

  getSubmissions(options?: FormQueryOptions): Promise<FormSubmission[]>;
}

export interface ContactProvider {
  readonly id: IntegrationProviderId;
  readonly displayName: string;

  getContacts(options?: ContactQueryOptions): Promise<NormalizedContact[]>;
}

export function isMailProvider(value: unknown): value is MailProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "getEmails" in value &&
    "getEmailById" in value &&
    typeof (value as MailProvider).getEmails === "function"
  );
}

export function isCalendarProvider(value: unknown): value is CalendarProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "getEvents" in value &&
    "createEvent" in value &&
    typeof (value as CalendarProvider).getEvents === "function"
  );
}

export function isFormProvider(value: unknown): value is FormProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "getSubmissions" in value &&
    typeof (value as FormProvider).getSubmissions === "function"
  );
}

export function isContactProvider(value: unknown): value is ContactProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "getContacts" in value &&
    typeof (value as ContactProvider).getContacts === "function"
  );
}

export class IntegrationNotImplementedError extends Error {
  constructor(providerId: IntegrationProviderId, method: string) {
    super(
      `[HELPY Connect] ${providerId}.${method} ist noch nicht implementiert.`
    );
    this.name = "IntegrationNotImplementedError";
  }
}
