import type { ImmoScout24ClientConfig } from "@/features/immoscout24/services/types";

/**
 * ImmoScout24 REST Client — kapselt HTTP-Zugriff.
 * Noch ohne echte API-Anbindung.
 */
export class ImmoScout24Client {
  private accessToken?: string;

  constructor(private readonly config: ImmoScout24ClientConfig = {}) {
    this.accessToken = config.accessToken;
  }

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl ?? "https://api.immoscout24.ch";
  }

  get isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearTokens(): void {
    this.accessToken = undefined;
  }
}

export function createImmoScout24Client(
  config?: ImmoScout24ClientConfig
): ImmoScout24Client {
  return new ImmoScout24Client(config);
}
