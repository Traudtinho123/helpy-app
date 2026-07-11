export type {
  OAuthAuthContext,
  OAuthConnectionPublic,
  OAuthConnectionStatus,
  OAuthProviderId,
  OAuthStoredTokens,
} from "@/lib/oauth/types";

export {
  listOAuthConnectionsForCompany,
  upsertOAuthConnection,
  revokeOAuthConnection,
  updateOAuthConnectionSyncMeta,
} from "@/lib/oauth/connection-repository";

export {
  buildGoogleOAuthStartUrl,
  exchangeGoogleAuthCode,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/google-oauth-server";

export {
  buildMicrosoftOAuthStartUrl,
  exchangeMicrosoftAuthCode,
  isMicrosoftOAuthConfigured,
} from "@/lib/oauth/microsoft-oauth-server";

export {
  getValidGoogleTokensForCompany,
  getValidOutlookTokensForCompany,
  listValidGoogleTokensForCompany,
  listValidOutlookTokensForCompany,
} from "@/lib/oauth/token-service";

export { requireOAuthContext } from "@/lib/oauth/require-oauth-context";

export {
  buildOAuthReturnUrl,
  consumeOAuthStartState,
  storeOAuthStartState,
} from "@/lib/oauth/oauth-state-cookie";
