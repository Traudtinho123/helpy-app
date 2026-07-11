import { NextResponse } from "next/server";
import {
  canPreviewOfficeAttachment,
  isWordPreviewAttachment,
} from "@/features/documents/preview/office-document-preview-service";
import { convertWordBufferToPreview } from "@/features/documents/preview/word-document-preview-server";
import { fetchGmailAttachmentData } from "@/features/gmail/services/gmail/connector";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import { getValidGoogleTokensForCompany, requireOAuthContext } from "@/lib/oauth";

/** Server-seitige Word-Vorschau (mammoth läuft zuverlässig in Node). */
export async function GET(request: Request) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const connectionId = url.searchParams.get("connectionId")?.trim();
  const messageId = url.searchParams.get("messageId")?.trim();
  const attachmentId = url.searchParams.get("attachmentId")?.trim();
  const fileName = url.searchParams.get("fileName")?.trim() ?? "anhang.docx";
  const mimeType = url.searchParams.get("mimeType")?.trim() ?? "application/octet-stream";

  if (!connectionId || !messageId || !attachmentId) {
    return NextResponse.json(
      { error: "connectionId, messageId und attachmentId sind erforderlich." },
      { status: 400 }
    );
  }

  if (
    !canPreviewOfficeAttachment(fileName, mimeType) ||
    !isWordPreviewAttachment(fileName, mimeType)
  ) {
    return NextResponse.json(
      {
        status: "unsupported",
        message:
          "Nur .docx-Dateien können als Vorschau angezeigt werden. Bitte herunterladen.",
      },
      { status: 400 }
    );
  }

  const tokens = await getValidGoogleTokensForCompany(
    auth.context.companyId,
    connectionId
  );

  if (!tokens) {
    return NextResponse.json(
      { error: "Gmail-Verbindung nicht gefunden oder abgelaufen." },
      { status: 404 }
    );
  }

  try {
    const attachment = await fetchGmailAttachmentData(
      tokens.tokens.accessToken,
      messageId,
      {
        attachmentId,
        fileName,
        mimeType,
        size: 0,
      }
    );

    if (attachment.data.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Anhang enthält keine Daten." },
        { status: 502 }
      );
    }

    const preview = await convertWordBufferToPreview(attachment.data);
    return NextResponse.json(preview, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Word-Vorschau fehlgeschlagen.";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
