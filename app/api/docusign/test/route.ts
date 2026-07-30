import { NextResponse } from "next/server";
import { getDocuSignConfig, isDocuSignConfigured } from "@/lib/docusign/config";
import { testDocuSignConnection } from "@/lib/docusign/test-connection";

export const runtime = "nodejs";

function isPemPrivateKey(value: string): boolean {
  return value.includes("BEGIN") && value.includes("PRIVATE KEY");
}

export async function GET() {
  if (!isDocuSignConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "DocuSign ist nicht vollständig konfiguriert.",
        missing: [
          !process.env.DOCUSIGN_INTEGRATION_KEY && "DOCUSIGN_INTEGRATION_KEY",
          !process.env.DOCUSIGN_USER_ID && "DOCUSIGN_USER_ID",
          !process.env.DOCUSIGN_ACCOUNT_ID && "DOCUSIGN_ACCOUNT_ID",
          !process.env.DOCUSIGN_BASE_URL && "DOCUSIGN_BASE_URL",
          !process.env.DOCUSIGN_PRIVATE_KEY &&
            !process.env.DOCUSIGN_SECRET_KEY &&
            "DOCUSIGN_PRIVATE_KEY",
        ].filter(Boolean),
      },
      { status: 500 }
    );
  }

  const config = getDocuSignConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "DocuSign-Konfiguration konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  if (!isPemPrivateKey(config.privateKey)) {
    const looksLikeGuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        config.privateKey.trim()
      );

    return NextResponse.json(
      {
        success: false,
        error:
          "DOCUSIGN_PRIVATE_KEY ist kein gültiger RSA Private Key (PEM-Format erwartet).",
        hint: looksLikeGuid
          ? "Es sieht aus wie eine Key-Pair-ID (GUID), nicht der Private Key. DocuSign Admin → Settings → Apps and Keys → RSA Keypairs → Private Key kopieren (beginnt mit -----BEGIN RSA PRIVATE KEY-----)."
          : "DocuSign Admin → Settings → Apps and Keys → Add RSA Keypair → Private Key kopieren.",
        receivedKeyLength: config.privateKey.length,
      },
      { status: 500 }
    );
  }

  try {
    const result = await testDocuSignConnection(config);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, details: result.details },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      accountId: result.accountId,
      userName: result.userName,
      account: result.account,
      tokenExpiresIn: result.tokenExpiresIn,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter DocuSign-Fehler.";

    const responseBody =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "body" in error.response
        ? (error.response as { body?: unknown }).body
        : null;

    return NextResponse.json(
      {
        success: false,
        error: message,
        details: responseBody,
        hint:
          message.includes("consent_required") || message.includes("consent")
            ? `Einmalige Zustimmung erforderlich: https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${config.integrationKey}&redirect_uri=https://www.docusign.com`
            : message.includes("invalid_grant")
              ? "Prüfe DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY und ob Consent erteilt wurde."
              : null,
      },
      { status: 502 }
    );
  }
}
