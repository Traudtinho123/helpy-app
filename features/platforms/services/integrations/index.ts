export { HelpyConnect, helpyConnect } from "@/features/platforms/services/integrations/connect";

export {
  IntegrationNotImplementedError,
  isCalendarProvider,
  isContactProvider,
  isFormProvider,
  isMailProvider,
} from "@/features/platforms/services/integrations/provider";
export type {
  CalendarProvider,
  ContactProvider,
  FormProvider,
  MailProvider,
} from "@/features/platforms/services/integrations/provider";

export type {
  CalendarQueryOptions,
  ConnectOptions,
  ConnectionStatus,
  ContactQueryOptions,
  CreateEventInput,
  DisconnectOptions,
  EmailQueryOptions,
  FormQueryOptions,
  FormSubmission,
  IntegrationCategory,
  IntegrationConnection,
  IntegrationProviderId,
  NormalizedCalendarEvent,
  NormalizedContact,
  NormalizedEmail,
  ProviderCapabilities,
  SyncOptions,
  SyncResult,
} from "@/features/platforms/services/integrations/types";

export { createGmailService, GmailService } from "@/features/gmail/services/gmail/service";
export { createGmailClient, GmailClient } from "@/features/gmail/services/gmail/client";

export {
  createOutlookMailService,
  createMicrosoft365MailService,
  createOutlookContactService,
} from "@/features/gmail/services/microsoft/outlook";

export {
  createOutlookCalendarService,
  createMicrosoft365CalendarService,
} from "@/features/calendar/services/microsoft/calendar";

export { getGoogleConfig, isGoogleConfigured } from "@/features/gmail/services/google/config";
