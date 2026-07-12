import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import {
  fetchPendingTeamInvites,
  teamInviteRowToMember,
} from "@/lib/team/services/team-invite-repository";
import { resolveTeamPermissions } from "@/lib/team/services/team-permissions";
import type { TeamMember } from "@/lib/team/types/team-types";
import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";
import type { Database } from "@/lib/database/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient<Database>;

function resolveMemberRole(
  profileRole: string | null,
  dbRole: string | null
): TenantUserRole {
  if (profileRole === "owner") return "OWNER";
  if (profileRole === "admin") return "ADMIN";
  if (dbRole === "super_admin") return "OWNER";
  if (dbRole === "admin") return "ADMIN";
  return "EMPLOYEE";
}

export async function fetchCompanyTeamMembers(
  supabase: Supabase,
  companyId: string
): Promise<TeamMember[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, vorname, nachname, role, erstellt_am")
    .eq("company_id", companyId)
    .order("erstellt_am", { ascending: true });

  if (error || !profiles) {
    console.error("[team/members] profiles fetch failed:", error?.message);
    return [];
  }

  const admin = isSupabaseAdminConfigured() ? createAdminClient() : null;
  const members: TeamMember[] = [];
  const activeEmails = new Set<string>();

  for (const profile of profiles) {
    let email = "";
    let hasSignedIn = false;

    if (admin) {
      const { data: authData } = await admin.auth.admin.getUserById(profile.id);
      email = authData.user?.email ?? "";
      hasSignedIn = Boolean(authData.user?.last_sign_in_at);
    }

    if (email) {
      activeEmails.add(email.toLowerCase());
    }

    const fullName =
      [profile.vorname, profile.nachname].filter(Boolean).join(" ").trim() ||
      email ||
      "Unbekannt";

    let dbRole: string | null = null;
    if (admin) {
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .eq("company_id", companyId)
        .maybeSingle();
      dbRole = roleRow?.role ?? null;
    }

    const role = resolveMemberRole(profile.role, dbRole);

    members.push({
      userId: profile.id,
      companyId,
      fullName,
      email,
      role,
      status: hasSignedIn ? "active" : "pending",
      avatar: null,
      permissions: resolveTeamPermissions(role),
      connectedPlatforms: {
        gmail: false,
        appleCalendar: false,
        googleCalendar: false,
      },
      lastActivity: hasSignedIn ? "Aktiv" : "Warten auf Bestätigung",
      createdAt: profile.erstellt_am ?? new Date().toISOString(),
    });
  }

  const pendingInvites = await fetchPendingTeamInvites(supabase, companyId);
  for (const invite of pendingInvites) {
    const normalized = invite.email.trim().toLowerCase();
    if (activeEmails.has(normalized)) {
      continue;
    }
    members.push(teamInviteRowToMember(invite));
  }

  return members;
}

export async function isEmailAlreadyInCompany(
  supabase: Supabase,
  companyId: string,
  email: string
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  const pendingInvite = await supabase
    .from("team_invites")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .ilike("email", normalized)
    .maybeSingle();

  if (pendingInvite.data) {
    return true;
  }

  const admin = isSupabaseAdminConfigured() ? createAdminClient() : null;
  if (!admin) {
    return false;
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .eq("company_id", companyId);

  if (!profiles?.length) return false;

  for (const profile of profiles) {
    const { data: authData } = await admin.auth.admin.getUserById(profile.id);
    if (authData.user?.email?.toLowerCase() === normalized) {
      return true;
    }
  }

  return false;
}
