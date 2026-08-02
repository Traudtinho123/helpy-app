import { readApiErrorMessage } from "@/lib/http/fetch-errors";
import type { CompanyProfile } from "@/lib/company/company-profile-types";

export type CompanyProfileLoadResult =
  | { ok: true; profile: CompanyProfile; source: "supabase" | "memory" }
  | { ok: false; error: string };

export type CompanyProfileSaveResult =
  | { ok: true; profile: CompanyProfile }
  | { ok: false; error: string };

export async function fetchCompanyProfileFromApi(): Promise<CompanyProfileLoadResult> {
  try {
    const response = await fetch("/api/company-settings", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const raw = await response.text().catch(() => "");

    if (!response.ok) {
      if (raw) {
        try {
          const payload = JSON.parse(raw) as { error?: string };
          return {
            ok: false,
            error: payload.error ?? "Firmendaten konnten nicht geladen werden.",
          };
        } catch {
          return {
            ok: false,
            error: await readApiErrorMessage(
              new Response(raw, { status: response.status }),
              "Firmendaten konnten nicht geladen werden."
            ),
          };
        }
      }

      return {
        ok: false,
        error: "Firmendaten konnten nicht geladen werden.",
      };
    }

    const payload = JSON.parse(raw) as {
      profile?: CompanyProfile | null;
      error?: string;
    };

    if (!payload.profile) {
      return {
        ok: false,
        error: "Kein Unternehmensprofil gefunden.",
      };
    }

    return { ok: true, profile: payload.profile, source: "supabase" };
  } catch {
    return {
      ok: false,
      error: "Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.",
    };
  }
}

export async function saveCompanyProfileToApi(
  profile: CompanyProfile
): Promise<CompanyProfileSaveResult> {
  try {
    const response = await fetch("/api/company-settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const raw = await response.text().catch(() => "");

    if (!response.ok) {
      if (raw) {
        try {
          const payload = JSON.parse(raw) as { error?: string };
          return {
            ok: false,
            error: payload.error ?? "Firmendaten konnten nicht gespeichert werden.",
          };
        } catch {
          return {
            ok: false,
            error: await readApiErrorMessage(
              new Response(raw, { status: response.status }),
              "Firmendaten konnten nicht gespeichert werden."
            ),
          };
        }
      }

      return {
        ok: false,
        error: "Firmendaten konnten nicht gespeichert werden.",
      };
    }

    const payload = JSON.parse(raw) as {
      profile?: CompanyProfile;
      error?: string;
    };

    if (!payload.profile) {
      return {
        ok: false,
        error: "Speichern erfolgreich, aber keine Profildaten zurückgegeben.",
      };
    }

    return { ok: true, profile: payload.profile };
  } catch {
    return {
      ok: false,
      error: "Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.",
    };
  }
}
