export type {
  MailMessageDirection,
  MailProviderId,
  UnifiedMailAttachment,
  UnifiedMailMessage,
  UnifiedMailThreadSnapshot,
} from "@/features/mail/types/unified-mail-types";

export {
  MAIL_PROVIDER_IDS,
  MAIL_PROVIDER_REGISTRY,
  getMailProviderDefinition,
  getMailProviderLabel,
  resolveMailProviderFromVorgang,
  type MailProviderDefinition,
} from "@/features/mail/services/mail-provider-registry";

export {
  analyzeMailThread,
  analyzeUnifiedMailThread,
  resolveMailMessageDirection,
  resolveUnifiedMessageDirection,
} from "@/features/mail/services/mail-thread-engine";

export {
  mapGmailConnectorToUnifiedMail,
  mapGmailMessageToUnifiedMail,
  mapGraphMessageToUnifiedMail,
  mapGraphMessagesToUnifiedMail,
  mapOutlookMessageToUnifiedMail,
  mapOutlookMessagesToUnifiedMail,
  mapUnifiedMailToGmailConnector,
} from "@/features/mail/services/unified-mail-mapper";

export { hasAnyMailVorgaenge, hasMailVorgaenge } from "@/features/mail/unified-mail-source-service";

export {
  getAllMailVorgaenge,
  getMailListeVorgang,
  getMailWorkspaceVorgang,
  subscribeAllMailVorgaenge,
} from "@/features/mail/unified-mail-source-service";

export {
  EMPTY_MAIL_SUMMARY,
  getActiveOpenMailCasesCount,
  getMailSummary,
  getServerActiveOpenMailCasesCountSnapshot,
  getStableActiveOpenMailCasesCountSnapshot,
  subscribeMailSummary,
  type MailSummary,
} from "@/features/mail/mail-summary";

export { isMailSyncLoading } from "@/features/mail/mail-sync-status";

export {
  analyzeUnifiedMailMessage,
  analyzeUnifiedMailMessages,
  buildMailVorgangBundles,
} from "@/features/mail/mail-brain-adapter";
