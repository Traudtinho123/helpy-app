/** Alle unterstützten bzw. geplanten Integrationen. */
export type IntegrationProviderId =
  | "gmail"
  | "outlook"
  | "microsoft-365"
  | "imap"
  | "forms"
  | "google-calendar"
  | "apple-calendar";

export type IntegrationCategory =
  | "mail"
  | "calendar"
  | "contacts"
  | "forms";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing"
  | "error";

export type IntegrationConnection = {
  providerId: IntegrationProviderId;
  status: ConnectionStatus;
  accountLabel?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
};

export type SyncResult = {
  providerId: IntegrationProviderId;
  syncedAt: string;
  itemsSynced: number;
  success: boolean;
  errorMessage?: string;
};

/** Normalisierte Domain-Typen — Brain und UI konsumieren nur diese. */
export type NormalizedEmail = {
  id: string;
  providerId: IntegrationProviderId;
  subject: string;
  from: string;
  fromName?: string;
  receivedAt: string;
  preview: string;
  body?: string;
  isRead: boolean;
  threadId?: string;
};

export type NormalizedCalendarEvent = {
  id: string;
  providerId: IntegrationProviderId;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
};

export type NormalizedContact = {
  id: string;
  providerId: IntegrationProviderId;
  displayName: string;
  email?: string;
  company?: string;
  phone?: string;
};

export type FormSubmission = {
  id: string;
  providerId: IntegrationProviderId;
  formName: string;
  submittedAt: string;
  submitterName?: string;
  submitterEmail?: string;
  summary: string;
  fields: Record<string, string>;
};

export type ConnectOptions = {
  redirectUri?: string;
  scopes?: string[];
};

export type DisconnectOptions = {
  revokeToken?: boolean;
};

export type SyncOptions = {
  fullSync?: boolean;
};

export type EmailQueryOptions = {
  since?: string;
  limit?: number;
  unreadOnly?: boolean;
};

export type CalendarQueryOptions = {
  from?: string;
  to?: string;
  limit?: number;
};

export type CreateEventInput = {
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
};

export type ContactQueryOptions = {
  search?: string;
  limit?: number;
};

export type FormQueryOptions = {
  since?: string;
  limit?: number;
};

export type ProviderCapabilities = {
  mail: boolean;
  calendar: boolean;
  contacts: boolean;
  forms: boolean;
};
