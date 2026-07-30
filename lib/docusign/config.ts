export type DocuSignConfig = {
  integrationKey: string;
  userId: string;
  privateKey: string;
  accountId: string;
  baseUrl: string;
  oauthHost: string;
};

function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("BEGIN")) {
    return trimmed.replace(/\\n/g, "\n");
  }
  return trimmed;
}

export function isDocuSignConfigured(): boolean {
  return Boolean(
    process.env.DOCUSIGN_INTEGRATION_KEY &&
      process.env.DOCUSIGN_ACCOUNT_ID &&
      process.env.DOCUSIGN_BASE_URL &&
      (process.env.DOCUSIGN_PRIVATE_KEY || process.env.DOCUSIGN_SECRET_KEY) &&
      process.env.DOCUSIGN_USER_ID
  );
}

export function getDocuSignConfig(): DocuSignConfig | null {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY?.trim();
  const userId = process.env.DOCUSIGN_USER_ID?.trim();
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID?.trim();
  const baseUrl = process.env.DOCUSIGN_BASE_URL?.trim();
  const privateKeyRaw =
    process.env.DOCUSIGN_PRIVATE_KEY?.trim() ??
    process.env.DOCUSIGN_SECRET_KEY?.trim();

  if (!integrationKey || !userId || !accountId || !baseUrl || !privateKeyRaw) {
    return null;
  }

  const oauthHost =
    process.env.DOCUSIGN_OAUTH_HOST?.trim() ??
    (baseUrl.includes("demo") ? "account-d.docusign.com" : "account.docusign.com");

  return {
    integrationKey,
    userId,
    privateKey: normalizePrivateKey(privateKeyRaw),
    accountId,
    baseUrl: baseUrl.replace(/\/$/, ""),
    oauthHost,
  };
}
