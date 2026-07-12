import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
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

  for (const profile of profiles) {
    const { data: authData } = await admin.auth.admin.getUserById(profile.id);
    const email = authData.user?.email ?? "";
    const fullName =
      [profile.vorname, profile.nachname].filter(Boolean).join(" ").trim() ||
      email ||
      "Unbekannt";

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .eq("company_id", companyId)
      .maybeSingle();

    const role = resolveMemberRole(profile.role, roleRow?.role ?? null);

    members.push({
      userId: profile.id,
      companyId,
      fullName,
      email,
      role,
      status: "active",
      avatar: null,
      permissions: resolveTeamPermissions(role),
      connectedPlatforms: {
        gmail: false,
        appleCalendar: false,
        googleCalendar: false,
      },
      lastActivity: "Aktiv",
      createdAt: profile.erstellt_am ?? new Date().toISOString(),
    });
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

  return false;
}
