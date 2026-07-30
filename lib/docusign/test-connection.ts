import { createRequire } from "node:module";
import type { DocuSignConfig } from "@/lib/docusign/config";

type DocuSignSdk = {
  ApiClient: new () => {
    setOAuthBasePath: (host: string) => void;
    setBasePath: (url: string) => void;
    addDefaultHeader: (name: string, value: string) => void;
    requestJWTUserToken: (
      integrationKey: string,
      userId: string,
      scopes: string[],
      rsaKey: Buffer,
      expiresIn: number
    ) => Promise<{ body?: { access_token?: string; expires_in?: number } }>;
  };
  AccountsApi: new (client: unknown) => {
    getAccountInformation: (accountId: string) => Promise<{
      accountId?: string;
      accountName?: string;
      accountIdLabel?: string;
      planName?: string;
      created?: string;
    }>;
  };
};

let cachedSdk: DocuSignSdk | null = null;

export function loadDocuSignSdk(): DocuSignSdk {
  if (cachedSdk) return cachedSdk;

  const require = createRequire(import.meta.url);
  cachedSdk = require("docusign-esign") as DocuSignSdk;
  return cachedSdk;
}

export async function testDocuSignConnection(config: DocuSignConfig) {
  const docusign = loadDocuSignSdk();
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(config.oauthHost);

  const tokenResult = await apiClient.requestJWTUserToken(
    config.integrationKey,
    config.userId,
    ["signature", "impersonation"],
    Buffer.from(config.privateKey),
    10 * 60
  );

  const accessToken = tokenResult.body?.access_token;
  if (!accessToken) {
    return {
      ok: false as const,
      error: "JWT-Token wurde nicht zurückgegeben.",
      details: tokenResult.body ?? null,
    };
  }

  apiClient.setBasePath(config.baseUrl);
  apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

  const accountsApi = new docusign.AccountsApi(apiClient);
  const accountInfo = await accountsApi.getAccountInformation(config.accountId);

  return {
    ok: true as const,
    accountId: accountInfo.accountId ?? config.accountId,
    userName: accountInfo.accountName ?? accountInfo.accountIdLabel ?? null,
    account: {
      name: accountInfo.accountName ?? null,
      plan: accountInfo.planName ?? null,
      created: accountInfo.created ?? null,
    },
    tokenExpiresIn: tokenResult.body?.expires_in ?? null,
  };
}
