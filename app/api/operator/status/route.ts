import { NextResponse } from "next/server";
import {
  getPlatformOperatorSnapshot,
  isSupabaseOperatorApiConfigured,
} from "@/lib/auth/platform-operator";

export async function GET() {
  const snapshot = await getPlatformOperatorSnapshot();

  return NextResponse.json({
    isOperator: snapshot.isOperator,
    source: snapshot.source,
    adminConfigured: isSupabaseOperatorApiConfigured(),
  });
}
