import { NextResponse } from "next/server";
import { recordNurturingOpen } from "@/lib/nurturing/nurturing-repository";

/** 1×1 transparent GIF */
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (token && token.length > 8) {
    try {
      await recordNurturingOpen(token);
    } catch (error) {
      console.error("[nurturing] track open failed:", error);
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
