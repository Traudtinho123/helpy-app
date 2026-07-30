import { SignJWT, importPKCS8 } from "jose";
import type { DocumentSigner } from "@/features/signatures/types/signature-types";
import { getDocuSignConfig, isDocuSignConfigured } from "@/lib/docusign/config";

type DocuSignEnvelopeResult = {
  envelopeId: string;
  status: string;
  provider: "docusign" | "mock";
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const config = getDocuSignConfig();
  if (!config) {
    throw new Error("DocuSign ist nicht konfiguriert.");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const privateKey = await importPKCS8(config.privateKey, "RS256");
  const assertion = await new SignJWT({
    scope: "signature impersonation",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(config.integrationKey)
    .setSubject(config.userId)
    .setAudience(`https://${config.oauthHost}/oauth/token`)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privateKey);

  const response = await fetch(`https://${config.oauthHost}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? "DocuSign OAuth fehlgeschlagen."
    );
  }

  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  };

  return body.access_token;
}

function buildSignatureTabs(pageCount = 1) {
  const anchorY = 650;
  return {
    signHereTabs: [
      {
        documentId: "1",
        pageNumber: String(pageCount),
        xPosition: "72",
        yPosition: String(anchorY),
        tabLabel: "Unterschrift",
      },
    ],
  };
}

export async function createDocuSignEnvelope(input: {
  fileName: string;
  pdfBase64: string;
  signers: DocumentSigner[];
  emailSubject: string;
  emailMessage: string;
}): Promise<DocuSignEnvelopeResult> {
  if (!isDocuSignConfigured()) {
    return {
      envelopeId: `mock-env-${Date.now()}`,
      status: "sent",
      provider: "mock",
    };
  }

  const config = getDocuSignConfig();
  if (!config) {
    throw new Error("DocuSign-Konfiguration unvollständig.");
  }

  const token = await getAccessToken();

  const recipients = {
    signers: input.signers.map((signer, index) => ({
      email: signer.email,
      name: signer.name,
      recipientId: String(index + 1),
      routingOrder: String(index + 1),
      tabs: buildSignatureTabs(),
    })),
  };

  const envelopeDefinition = {
    emailSubject: input.emailSubject,
    emailBlurb: input.emailMessage,
    status: "sent",
    documents: [
      {
        documentBase64: input.pdfBase64,
        name: input.fileName,
        fileExtension: "pdf",
        documentId: "1",
      },
    ],
    recipients,
  };

  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelopeDefinition),
    }
  );

  const body = (await response.json()) as {
    envelopeId?: string;
    status?: string;
    message?: string;
  };

  if (!response.ok || !body.envelopeId) {
    throw new Error(body.message ?? "DocuSign Envelope konnte nicht erstellt werden.");
  }

  return {
    envelopeId: body.envelopeId,
    status: body.status ?? "sent",
    provider: "docusign",
  };
}

export async function voidDocuSignEnvelope(envelopeId: string, reason: string) {
  if (!isDocuSignConfigured()) return;

  const config = getDocuSignConfig();
  if (!config) return;

  const token = await getAccessToken();
  await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "voided", voidedReason: reason }),
    }
  );
}

export async function remindDocuSignEnvelope(envelopeId: string) {
  if (!isDocuSignConfigured()) return;

  const config = getDocuSignConfig();
  if (!config) return;

  const token = await getAccessToken();
  await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}?resend_envelope=true`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "sent" }),
    }
  );
}

export async function downloadSignedDocuSignPdf(
  envelopeId: string
): Promise<Buffer | null> {
  if (!isDocuSignConfigured()) return null;

  const config = getDocuSignConfig();
  if (!config) return null;

  const token = await getAccessToken();
  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/documents/combined`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) return null;
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function testDocuSignConnection(config: NonNullable<
  ReturnType<typeof getDocuSignConfig>
>) {
  let accessToken: string;
  let tokenExpiresIn: number | null = null;

  try {
    const privateKey = await importPKCS8(config.privateKey, "RS256");
    const assertion = await new SignJWT({
      scope: "signature impersonation",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(config.integrationKey)
      .setSubject(config.userId)
      .setAudience(`https://${config.oauthHost}/oauth/token`)
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(privateKey);

    const tokenResponse = await fetch(`https://${config.oauthHost}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    const tokenBody = (await tokenResponse.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !tokenBody.access_token) {
      return {
        ok: false as const,
        error:
          tokenBody.error_description ??
          tokenBody.error ??
          "DocuSign OAuth fehlgeschlagen.",
        details: tokenBody,
      };
    }

    accessToken = tokenBody.access_token;
    tokenExpiresIn = tokenBody.expires_in ?? null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DocuSign OAuth fehlgeschlagen.";
    return {
      ok: false as const,
      error: message,
      details: null,
    };
  }

  const accountResponse = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const accountBody = (await accountResponse.json()) as {
    accountId?: string;
    accountName?: string;
    accountIdLabel?: string;
    planName?: string;
    created?: string;
    message?: string;
    errorCode?: string;
  };

  if (!accountResponse.ok) {
    return {
      ok: false as const,
      error:
        accountBody.message ??
        accountBody.errorCode ??
        "DocuSign Account-Informationen konnten nicht geladen werden.",
      details: accountBody,
    };
  }

  return {
    ok: true as const,
    accountId: accountBody.accountId ?? config.accountId,
    userName: accountBody.accountName ?? accountBody.accountIdLabel ?? null,
    account: {
      name: accountBody.accountName ?? null,
      plan: accountBody.planName ?? null,
      created: accountBody.created ?? null,
    },
    tokenExpiresIn,
  };
}

export function mapDocuSignEnvelopeStatus(
  status: string,
  signerCount: number,
  completedSigners: number
): "gesendet" | "teilweise" | "vollstaendig" | "abgebrochen" | "abgelaufen" {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "vollstaendig";
  if (normalized === "voided" || normalized === "declined") return "abgebrochen";
  if (normalized === "expired") return "abgelaufen";
  if (completedSigners > 0 && completedSigners < signerCount) return "teilweise";
  return "gesendet";
}
