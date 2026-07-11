export {
  createDevOAuthContext as createDevCompanyContext,
  requireOAuthContext as requireCompanyContext,
  type RequireOAuthContextResult as RequireCompanyContextResult,
} from "@/lib/oauth/require-oauth-context";

export type { OAuthAuthContext as CompanyAuthContext } from "@/lib/oauth/types";
