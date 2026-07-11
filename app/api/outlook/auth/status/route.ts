import { NextResponse } from "next/server";
import {
  listOAuthConnectionsForCompany,
  requireOAuthContext,
} from "@/lib/oauth";

export async function GET(): Promise<NextResponse> {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({
      status: "disconnected",
      accountEmail: null,
      connectedAt: null,
      lastSyncAt: null,
      lastError: null,
      messagesToday: 0,
      hasAccessToken: false,
      hasRefreshToken: false,
      accounts: [],
    });
  }

  const accounts = await listOAuthConnectionsForCompany(
    auth.context.companyId,
    "microsoft"
  );

  if (accounts.length === 0) {
    return NextResponse.json({
      status: "disconnected",
      accountEmail: null,
      connectedAt: null,
      lastSyncAt: null,
      lastError: null,
      messagesToday: 0,
      hasAccessToken: false,
      hasRefreshToken: false,
      accounts: [],
    });
  }

  const primary = accounts[0];
  const hasError = accounts.some((item) => item.status === "error");

  return NextResponse.json({
    status: hasError ? "error" : "connected",
    accountEmail: primary.accountEmail,
    connectedAt: primary.connectedAt,
    lastSyncAt: primary.lastSyncAt,
    lastError: primary.lastError,
    messagesToday: 0,
    hasAccessToken: true,
    hasRefreshToken: true,
    accounts,
    accountCount: accounts.length,
  });
}
