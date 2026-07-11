import type { GoogleOAuthConfig } from "@/features/gmail/services/google/config";
import type { GmailClientTokens } from "@/features/gmail/services/gmail/types";

export type GmailClientConfig = GoogleOAuthConfig & GmailClientTokens;

/**
 * Gmail REST Client — kapselt HTTP-Zugriff.
 * Erste Test-Integration; Outlook/IMAP folgen mit eigenem Client.
 */
export class GmailClient {
  private tokens: GmailClientTokens = {};

  constructor(private readonly config: GmailClientConfig) {}

  get apiBaseUrl(): string {
    return "https://gmail.googleapis.com/gmail/v1";
  }

  get isAuthenticated(): boolean {
    return Boolean(this.tokens.accessToken);
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    this.tokens = { accessToken, refreshToken };
  }

  clearTokens(): void {
    this.tokens = {};
  }
}

export function createGmailClient(config: GmailClientConfig): GmailClient {
  return new GmailClient(config);
}
