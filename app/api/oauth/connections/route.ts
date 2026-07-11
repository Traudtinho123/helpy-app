import { NextResponse } from "next/server";
import {
  listOAuthConnectionsForCompany,
  requireOAuthContext,
} from "@/lib/oauth";
import type { OAuthProviderId } from "@/lib/oauth/types";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const providerParam = url.searchParams.get("provider");
  const provider =
    providerParam === "google" || providerParam === "microsoft"
      ? (providerParam as OAuthProviderId)
      : undefined;

  const connections = await listOAuthConnectionsForCompany(
    auth.context.companyId,
    provider
  );

  const grouped = {
    google: connections.filter((item) => item.provider === "google"),
    microsoft: connections.filter((item) => item.provider === "microsoft"),
  };

  return NextResponse.json({
    companyId: auth.context.companyId,
    connections,
    grouped,
    counts: {
      google: grouped.google.length,
      microsoft: grouped.microsoft.length,
      total: connections.length,
    },
  });
}
