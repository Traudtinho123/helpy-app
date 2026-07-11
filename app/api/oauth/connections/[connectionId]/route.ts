import { NextResponse } from "next/server";
import { clearOutlookTokensFromCookies } from "@/features/outlook/services/outlook-auth-server";
import {
  listOAuthConnectionsForCompany,
  requireOAuthContext,
  revokeOAuthConnection,
} from "@/lib/oauth";

type RouteContext = {
  params: Promise<{ connectionId: string }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { connectionId } = await context.params;
  const connections = await listOAuthConnectionsForCompany(
    auth.context.companyId
  );
  const target = connections.find((item) => item.id === connectionId);

  if (!target) {
    return NextResponse.json(
      { error: "Verbindung nicht gefunden." },
      { status: 404 }
    );
  }

  const revoked = await revokeOAuthConnection(
    connectionId,
    auth.context.companyId
  );

  if (!revoked) {
    return NextResponse.json(
      { error: "Verbindung konnte nicht getrennt werden." },
      { status: 500 }
    );
  }

  if (target.provider === "microsoft") {
    const remaining = await listOAuthConnectionsForCompany(
      auth.context.companyId,
      "microsoft"
    );
    if (remaining.length === 0) {
      await clearOutlookTokensFromCookies();
    }
  }

  return NextResponse.json({ ok: true });
}
