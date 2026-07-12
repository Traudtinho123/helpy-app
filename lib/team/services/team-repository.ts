import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  fetchPendingTeamInvites,
  teamInviteRowToMember,
} from "@/lib/team/services/team-invite-repository";
import { resolveTeamPermissions } from "@/lib/team/services/team-permissions";
import type { TeamMember } from "@/lib/team/types/team-types";
import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";

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
  companyId: string
): Promise<TeamMember[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, vorname, nachname, role, erstellt_am")
    .eq("company_id", companyId)
    .order("erstellt_am", { ascending: true });

  if (error || !profiles) return [];

  const members: TeamMember[] = [];
  const activeEmails = new Set<string>();

  for (const profile of profiles) {
    const { data: authData } = await admin.auth.admin.getUserById(profile.id);
    const email = authData.user?.email?.toLowerCase() ?? "";
    if (email) {
      activeEmails.add(email);
    }
    const fullName =
      [profile.vorname, profile.nachname].filter(Boolean).join(" ").trim() ||
      authData.user?.email ||
      "Unbekannt";

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .eq("company_id", companyId)
      .maybeSingle();

    const role = resolveMemberRole(profile.role, roleRow?.role ?? null);
    const hasSignedIn = Boolean(authData.user?.last_sign_in_at);

    members.push({
      userId: profile.id,
      companyId,
      fullName,
      email: authData.user?.email ?? "",
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

  const pendingInvites = await fetchPendingTeamInvites(companyId);
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
  companyId: string,
  email: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  const admin = createAdminClient();
  if (!admin) return false;

  const normalized = email.trim().toLowerCase();
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

  const { data: pendingInvite } = await admin
    .from("team_invites")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .ilike("email", normalized)
    .maybeSingle();

  return Boolean(pendingInvite);
}
