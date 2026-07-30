import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  return Object.fromEntries(
    readFileSync(resolve(root, ".env.local"), "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

const env = loadEnv();
for (const [key, value] of Object.entries(env)) {
  process.env[key] ??= value;
}

const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
const userId = process.env.DOCUSIGN_USER_ID;
const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
const baseUrl = process.env.DOCUSIGN_BASE_URL?.replace(/\/$/, "");
const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY ?? process.env.DOCUSIGN_SECRET_KEY ?? "")
  .trim()
  .replace(/\\n/g, "\n");
const oauthHost = process.env.DOCUSIGN_OAUTH_HOST ?? "account-d.docusign.com";

if (!integrationKey || !userId || !accountId || !baseUrl || !privateKey) {
  console.error(JSON.stringify({ success: false, error: "Missing env vars" }, null, 2));
  process.exit(1);
}

try {
  const docusign = await import("docusign-esign");
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(oauthHost);

  const tokenResult = await apiClient.requestJWTUserToken(
    integrationKey,
    userId,
    ["signature", "impersonation"],
    Buffer.from(privateKey),
    600
  );

  const accessToken = tokenResult.body?.access_token;
  if (!accessToken) {
    console.log(JSON.stringify({ success: false, error: "No access token", body: tokenResult.body }, null, 2));
    process.exit(1);
  }

  apiClient.setBasePath(baseUrl);
  apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

  const accountsApi = new docusign.AccountsApi(apiClient);
  const accountInfo = await accountsApi.getAccountInformation(accountId);

  console.log(
    JSON.stringify(
      {
        success: true,
        accountId: accountInfo.accountId ?? accountId,
        userName: accountInfo.accountName ?? accountInfo.accountIdLabel ?? null,
        tokenExpiresIn: tokenResult.body?.expires_in ?? null,
      },
      null,
      2
    )
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const body =
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "body" in error.response
      ? error.response.body
      : null;

  console.log(JSON.stringify({ success: false, error: message, details: body }, null, 2));
  process.exit(1);
}
