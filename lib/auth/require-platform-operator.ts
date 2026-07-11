import { NextResponse } from "next/server";
import {
  getPlatformOperatorSnapshot,
  isSupabaseOperatorApiConfigured,
} from "@/lib/auth/platform-operator";
import { getSkillAccessForCurrentUser } from "@/lib/auth/skill-access";

export async function requirePlatformOperatorApi() {
  const access = await getSkillAccessForCurrentUser();

  if (!access.userId && access.source !== "dev-fallback") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }),
    };
  }

  const operator = await getPlatformOperatorSnapshot();

  if (!operator.isOperator) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Keine Betreiber-Berechtigung.", code: "NOT_OPERATOR" },
        { status: 403 }
      ),
    };
  }

  if (!isSupabaseOperatorApiConfigured() && access.source !== "dev-fallback") {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY fehlt — Betreiber-API kann Nutzer-E-Mails nicht laden.",
          code: "ADMIN_NOT_CONFIGURED",
        },
        { status: 503 }
      ),
    };
  }

  return { ok: true as const, operator };
}
