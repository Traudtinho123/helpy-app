import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import { resolveTeamPermissions } from "@/lib/team/services/team-permissions";
import type { TeamMember } from "@/lib/team/types/team-types";
import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";
import type { Database } from "@/lib/database/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient<Database>;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "https://helpy-app.vercel.app";

type TeamInviteRow = {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
};

function mapInviteRole(role: string): TenantUserRole {
  return role === "admin" ? "ADMIN" : "EMPLOYEE";
}

function mapTenantRoleToInviteRole(role: TenantUserRole): "admin" | "member" {
  return role === "ADMIN" ? "admin" : "member";
}

export function teamInviteRowToMember(row: TeamInviteRow): TeamMember {
  const role = mapInviteRole(row.role);
  const isPending = row.status === "pending";

  return {
    userId: row.accepted_user_id ?? `pending-${row.id}`,
    companyId: row.company_id,
    fullName: row.full_name,
    email: row.email,
    role,
    status: isPending ? "pending" : "active",
    avatar: null,
    permissions: resolveTeamPermissions(role),
    connectedPlatforms: {
      gmail: false,
      appleCalendar: false,
      googleCalendar: false,
    },
    lastActivity: isPending ? "Warten auf Bestätigung" : "Aktiv",
    createdAt: row.invited_at,
  };
}

export async function findPendingInviteByEmail(
  supabase: Supabase,
  companyId: string,
  email: string
): Promise<TeamInviteRow | null> {
  const normalized = email.trim().toLowerCase();
  const { data } = await supabase
    .from("team_invites")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .ilike("email", normalized)
    .maybeSingle();

  return (data as TeamInviteRow | null) ?? null;
}

export async function createTeamInvite(
  supabase: Supabase,
  input: {
    companyId: string;
    email: string;
    fullName: string;
    role: TenantUserRole;
    invitedBy: string;
  }
): Promise<{ ok: true; invite: TeamInviteRow } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      company_id: input.companyId,
      email,
      full_name: input.fullName.trim(),
      role: mapTenantRoleToInviteRole(input.role),
      status: "pending",
      invited_by: input.invitedBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[team/invite] insert failed:", error?.message, error?.code);
    if (error?.code === "42P01") {
      return {
        ok: false,
        error:
          "Tabelle team_invites fehlt. Bitte Migration 20260712110000_team_invites.sql ausführen.",
      };
    }
    if (error?.code === "42501") {
      return {
        ok: false,
        error:
          "Keine Berechtigung zum Speichern der Einladung. Bitte Migration 20260712110100_team_invites_rls_authenticated.sql ausführen.",
      };
    }
    if (error?.code === "23505") {
      return { ok: false, error: "Für diese E-Mail liegt bereits eine Einladung vor." };
    }
    return { ok: false, error: "Einladung konnte nicht gespeichert werden." };
  }

  return { ok: true, invite: data as TeamInviteRow };
}

export async function fetchPendingTeamInvites(
  supabase: Supabase,
  companyId: string
): Promise<TeamInviteRow[]> {
  const { data, error } = await supabase
    .from("team_invites")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("invited_at", { ascending: true });

  if (error) {
    console.error("[team/invite] pending fetch failed:", error.message, error.code);
    return [];
  }

  return (data as TeamInviteRow[] | null) ?? [];
}

export async function acceptTeamInviteForUser(input: {
  userId: string;
  email: string | null | undefined;
}): Promise<void> {
  if (!input.email || !isSupabaseAdminConfigured()) return;

  const admin = createAdminClient();
  if (!admin) return;

  const normalized = input.email.trim().toLowerCase();
  const { data: invites } = await admin
    .from("team_invites")
    .select("*")
    .eq("status", "pending")
    .ilike("email", normalized);

  if (!invites?.length) return;

  for (const invite of invites as TeamInviteRow[]) {
    await admin
      .from("team_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_user_id: input.userId,
      })
      .eq("id", invite.id)
      .eq("status", "pending");
  }
}

export async function createAuthInviteLink(input: {
  email: string;
  fullName: string;
  companyId: string;
  companyName: string;
  role: TenantUserRole;
}): Promise<{ link: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { link: `${APP_URL}/login?email=${encodeURIComponent(input.email)}` };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { link: `${APP_URL}/login?email=${encodeURIComponent(input.email)}` };
  }

  const nameParts = input.fullName.trim().split(/\s+/);
  const vorname = nameParts[0] ?? input.fullName;
  const nachname = nameParts.slice(1).join(" ");
  const invitedRole = mapTenantRoleToInviteRole(input.role);
  const redirectTo = `${APP_URL}/auth/callback?next=${encodeURIComponent("/")}`;
  const metadata = {
    vorname,
    nachname,
    invited_company_id: input.companyId,
    invited_role: invitedRole,
    firma: input.companyName,
  };

  const inviteLink = await admin.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: {
      redirectTo,
      data: metadata,
    },
  });

  if (!inviteLink.error && inviteLink.data.properties?.action_link) {
    return { link: inviteLink.data.properties.action_link };
  }

  const magicLink = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
    options: {
      redirectTo,
      data: metadata,
    },
  });

  if (!magicLink.error && magicLink.data.properties?.action_link) {
    return { link: magicLink.data.properties.action_link };
  }

  console.warn(
    "[team/invite] Auth link fallback:",
    inviteLink.error?.message ?? magicLink.error?.message
  );

  return {
    link: `${APP_URL}/login?email=${encodeURIComponent(input.email)}`,
  };
}

export function buildTeamInviteEmail(input: {
  fullName: string;
  email: string;
  companyName: string;
  loginLink: string;
}): { subject: string; text: string } {
  return {
    subject: `Einladung zum HELPY Team — ${input.companyName}`,
    text: [
      `Hallo ${input.fullName},`,
      "",
      `du wurdest zu ${input.companyName} bei HELPY eingeladen.`,
      "",
      "Dein Zugang gilt ausschließlich für diese E-Mail-Adresse:",
      input.email,
      "",
      "→ Jetzt einloggen und Zugang aktivieren:",
      input.loginLink,
      "",
      "Nach dem ersten Login wirst du im Team als aktiv angezeigt.",
      "",
      "Viele Grüße",
      "Dein HELPY Team",
    ].join("\n"),
  };
}
