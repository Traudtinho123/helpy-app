import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HelpyCompanyRoleDb } from "@/lib/database/types";

export type OperatorCompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  createdAt: string;
  memberCount: number;
  activeSkillCount: number;
};

export type OperatorMemberRow = {
  userId: string;
  email: string | null;
  fullName: string;
  role: HelpyCompanyRoleDb;
  allowedSkills: HelpySkill[];
  hasAccess: boolean;
  isPlatformOperator: boolean;
  companyId: string | null;
};

function buildFullName(params: {
  vorname: string | null;
  nachname: string | null;
  email: string | null;
}): string {
  const name = [params.vorname, params.nachname].filter(Boolean).join(" ").trim();
  if (name) return name;
  return params.email ?? "Unbekannt";
}

export async function listOperatorCompanies(): Promise<OperatorCompanyRow[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data: companies, error } = await admin
    .from("companies")
    .select("id, name, industry, created_at")
    .order("created_at", { ascending: false });

  if (error || !companies) {
    throw new Error(error?.message ?? "Unternehmen konnten nicht geladen werden.");
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("company_id, allowed_skills");

  const counts = new Map<string, { members: number; active: number }>();
  for (const profile of profiles ?? []) {
    if (!profile.company_id) continue;
    const current = counts.get(profile.company_id) ?? { members: 0, active: 0 };
    current.members += 1;
    if ((profile.allowed_skills ?? []).length > 0) {
      current.active += 1;
    }
    counts.set(profile.company_id, current);
  }

  return companies.map((company) => {
    const stats = counts.get(company.id) ?? { members: 0, active: 0 };
    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      createdAt: company.created_at,
      memberCount: stats.members,
      activeSkillCount: stats.active,
    };
  });
}

export async function listOperatorCompanyMembers(
  companyId: string
): Promise<OperatorMemberRow[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data: profiles, error } = await admin
    .from("profiles")
    .select(
      "id, company_id, vorname, nachname, role, allowed_skills, is_platform_operator"
    )
    .eq("company_id", companyId)
    .order("erstellt_am", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const emailByUserId = new Map<string, string>();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error: usersError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (usersError) {
      throw new Error(usersError.message);
    }

    for (const user of data.users) {
      if (user.email) {
        emailByUserId.set(user.id, user.email);
      }
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return (profiles ?? []).map((profile) => {
    const email = emailByUserId.get(profile.id) ?? null;
    const allowedSkills = normalizeAllowedSkills(
      (profile.allowed_skills as string[] | null) ?? []
    );

    return {
      userId: profile.id,
      email,
      fullName: buildFullName({
        vorname: profile.vorname,
        nachname: profile.nachname,
        email,
      }),
      role: profile.role as HelpyCompanyRoleDb,
      allowedSkills,
      hasAccess: allowedSkills.length > 0,
      isPlatformOperator: Boolean(profile.is_platform_operator),
      companyId: profile.company_id,
    };
  });
}

export async function updateOperatorMemberAllowedSkills(
  userId: string,
  allowedSkills: HelpySkill[]
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Admin-Client nicht konfiguriert.");
  }

  const { error } = await admin
    .from("profiles")
    .update({ allowed_skills: allowedSkills })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createOperatorCompany(name: string): Promise<{ id: string }> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Admin-Client nicht konfiguriert.");
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Unternehmensname fehlt.");
  }

  const { data, error } = await admin
    .from("companies")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unternehmen konnte nicht angelegt werden.");
  }

  return { id: data.id };
}
