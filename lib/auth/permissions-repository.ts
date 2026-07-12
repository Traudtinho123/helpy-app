import type { HelpySkillDb } from "@/lib/database/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { PUBLIC_SKILLS, SUPER_ADMIN_SKILLS } from "@/features/workspace/services/skills/all-skills";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type HelpyUserRole = "super_admin" | "admin" | "member";

export type CompanyRegistrationStatus = "pending" | "active" | "suspended";

export type CompanySkillRecord = {
  companyId: string;
  skill: string;
  isActive: boolean;
  activatedAt: string;
};

export type PendingCompanyRecord = {
  id: string;
  name: string;
  requestedSkill: string | null;
  registrationStatus: CompanyRegistrationStatus;
  createdAt: string;
  adminEmail: string | null;
  adminName: string | null;
};

const ALL_SKILLS: HelpySkill[] = [...SUPER_ADMIN_SKILLS];

const devRoles = new Map<string, HelpyUserRole>();
const devSuperAdmins = new Set<string>();
const devCompanySkills = new Map<string, CompanySkillRecord[]>();

export function setDevUserRole(userId: string, role: HelpyUserRole): void {
  devRoles.set(userId, role);
}

export function setDevSuperAdmin(userId: string, enabled: boolean): void {
  if (enabled) devSuperAdmins.add(userId);
  else devSuperAdmins.delete(userId);
}

export async function fetchProfileAccessRow(userId: string): Promise<{
  companyId: string | null;
  isSuperAdmin: boolean;
  profileRole: string | null;
  allowedSkills: string[];
} | null> {
  if (!isSupabaseConfigured()) {
    return {
      companyId: "dev-company",
      isSuperAdmin: devSuperAdmins.has(userId),
      profileRole: devRoles.get(userId) ?? "admin",
      allowedSkills: ["real-estate"],
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("company_id, is_super_admin, role, allowed_skills")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    companyId: data.company_id,
    isSuperAdmin: Boolean(data.is_super_admin),
    profileRole: data.role,
    allowedSkills: (data.allowed_skills as string[] | null) ?? [],
  };
}

export async function fetchUserRoleFromDb(
  userId: string,
  companyId: string | null
): Promise<HelpyUserRole> {
  if (!companyId) return "member";

  if (!isSupabaseAdminConfigured()) {
    if (devSuperAdmins.has(userId)) return "super_admin";
    return devRoles.get(userId) ?? "admin";
  }

  const admin = createAdminClient();
  if (!admin) return "member";

  const { data: profile } = await admin
    .from("profiles")
    .select("is_super_admin, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_super_admin) return "super_admin";

  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (roleRow?.role === "super_admin") return "super_admin";
  if (roleRow?.role === "admin") return "admin";
  if (roleRow?.role === "member") return "member";

  if (profile?.role === "owner" || profile?.role === "admin") return "admin";
  return "member";
}

export async function fetchCompanySkillsFromDb(
  companyId: string
): Promise<CompanySkillRecord[]> {
  if (!isSupabaseAdminConfigured()) {
    return devCompanySkills.get(companyId) ?? [];
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("company_skills")
    .select("company_id, skill, is_active, activated_at")
    .eq("company_id", companyId);

  if (error || !data) return [];

  return data.map((row) => ({
    companyId: row.company_id,
    skill: row.skill,
    isActive: row.is_active,
    activatedAt: row.activated_at,
  }));
}

export async function listPendingCompanies(): Promise<PendingCompanyRecord[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const admin = createAdminClient();
  if (!admin) return [];

  const { data: companies, error } = await admin
    .from("companies")
    .select("id, name, requested_skill, registration_status, created_at")
    .order("created_at", { ascending: false });

  if (error || !companies) return [];

  const results: PendingCompanyRecord[] = [];

  for (const company of companies) {
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("id, vorname, nachname")
      .eq("company_id", company.id)
      .in("role", ["owner", "admin"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let adminEmail: string | null = null;
    let adminName: string | null = null;

    if (adminProfile?.id) {
      const authData = await admin.auth.admin.getUserById(adminProfile.id);
      adminEmail = authData.data.user?.email ?? null;
      adminName = [adminProfile.vorname, adminProfile.nachname]
        .filter(Boolean)
        .join(" ")
        .trim() || null;
    }

    results.push({
      id: company.id,
      name: company.name,
      requestedSkill: company.requested_skill,
      registrationStatus: (company.registration_status ??
        "active") as CompanyRegistrationStatus,
      createdAt: company.created_at,
      adminEmail,
      adminName,
    });
  }

  return results;
}

export async function activateCompanySkill(input: {
  companyId: string;
  skill: string;
  activatedBy: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    const existing = devCompanySkills.get(input.companyId) ?? [];
    devCompanySkills.set(input.companyId, [
      ...existing.filter((item) => item.skill !== input.skill),
      {
        companyId: input.companyId,
        skill: input.skill,
        isActive: true,
        activatedAt: new Date().toISOString(),
      },
    ]);
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const { error: skillError } = await admin.from("company_skills").upsert(
    {
      company_id: input.companyId,
      skill: input.skill,
      is_active: true,
      activated_by: input.activatedBy,
      activated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,skill" }
  );

  if (skillError) {
    console.error("[permissions] activate skill failed:", skillError.message);
    return false;
  }

  const { data: ownerProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("company_id", input.companyId)
    .in("role", ["owner", "admin"]);

  for (const profile of ownerProfiles ?? []) {
    const dbSkill = PUBLIC_SKILLS.includes(input.skill as (typeof PUBLIC_SKILLS)[number])
      ? input.skill
      : "real-estate";
    await admin
      .from("profiles")
      .update({ allowed_skills: [dbSkill as HelpySkillDb] })
      .eq("id", profile.id);
  }

  await admin
    .from("companies")
    .update({ registration_status: "active" })
    .eq("id", input.companyId);

  return true;
}

export function getAllPlatformSkills(): HelpySkill[] {
  return ALL_SKILLS;
}
