import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";
import {
  TENANT_COMPANIES,
  TENANT_USER_PROFILES,
} from "@/lib/tenant/mock/tenant-mock";
import { applyTenantContextToLegacyStores } from "@/lib/tenant/services/tenant-bootstrap-service";
import type {
  Company,
  CompanySettings,
  SupabaseAuthIdentity,
  TenantContext,
  TenantUserRole,
  UserConnections,
} from "@/lib/tenant/types/tenant-types";
import type { UserRole } from "@/lib/user/types/user-profile-types";
import { createClient } from "@/lib/supabase/client";

type SupabaseProfileRow = {
  company_id: string | null;
  vorname: string | null;
  nachname: string | null;
  role: UserRole | null;
  firma: string | null;
  erstellt_am: string;
  is_super_admin: boolean;
  companies: {
    id: string;
    name: string;
    industry: string | null;
    requested_skill: string | null;
    created_at: string;
  } | null;
};

function mapProfileRoleToTenantRole(
  profileRole: UserRole | null,
  isSuperAdmin: boolean
): TenantUserRole {
  if (profileRole === "owner") return "OWNER";
  if (profileRole === "admin") return "ADMIN";
  if (isSuperAdmin) return "OWNER";
  return "EMPLOYEE";
}

function resolveActiveSkill(requestedSkill: string | null): HelpySkill {
  const normalized = normalizeAllowedSkills(
    requestedSkill ? [requestedSkill] : ["real-estate"]
  );
  return normalized[0] ?? "real-estate";
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HE";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function registerLiveTenantInMemoryStore(tenant: TenantContext): void {
  TENANT_COMPANIES[tenant.company.id] = tenant.company;
  TENANT_USER_PROFILES[tenant.userProfile.userId] = tenant.userProfile;
}

function buildTenantContextFromSupabase(
  auth: SupabaseAuthIdentity,
  row: SupabaseProfileRow
): TenantContext | null {
  const companyRow = row.companies;
  if (!row.company_id || !companyRow) {
    return null;
  }

  const companyName = companyRow.name.trim() || row.firma?.trim() || "Unternehmen";
  const fullName =
    [row.vorname, row.nachname].filter(Boolean).join(" ").trim() ||
    auth.fullName ||
    auth.email ||
    "Nutzer";
  const activeSkill = resolveActiveSkill(companyRow.requested_skill);
  const tenantRole = mapProfileRoleToTenantRole(row.role, row.is_super_admin);

  const company: Company = {
    id: companyRow.id,
    companyName,
    industry: companyRow.industry?.trim() || "Unternehmen",
    subscriptionPlan: "HELPY Pro",
    activeHelpyProfile: activeSkill,
    createdAt: companyRow.created_at,
  };

  const userConnections: UserConnections = {
    userId: auth.userId,
    gmailConnected: false,
    appleCalendarConnected: false,
    googleCalendarConnected: false,
    outlookConnected: false,
    lastSync: null,
    connectionStatus: "disconnected",
  };

  const companySettings: CompanySettings = {
    companyId: company.id,
    logo: null,
    branding: {
      primaryColor: "#1E3A8A",
      secondaryColor: "#3B82F6",
      logoInitials: buildInitials(companyName),
    },
    workingHours: {
      start: "08:00",
      end: "18:00",
    },
    emailTemplates: ["angebot", "offerte", "rechnung"],
    activePlatforms: ["gmail", "apple-calendar", "google-calendar"],
    brainProfile: activeSkill,
    notificationSettings: {
      email: true,
      push: true,
      digest: false,
    },
  };

  return {
    userProfile: {
      userId: auth.userId,
      companyId: row.company_id,
      fullName,
      role: tenantRole,
      avatar: auth.avatarUrl,
      createdAt: row.erstellt_am,
    },
    company,
    userConnections,
    companySettings,
  };
}

export async function loadLiveTenantContextFromSupabase(
  auth: SupabaseAuthIdentity
): Promise<TenantContext | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      company_id,
      vorname,
      nachname,
      role,
      firma,
      erstellt_am,
      is_super_admin,
      companies (
        id,
        name,
        industry,
        requested_skill,
        created_at
      )
    `
    )
    .eq("id", auth.userId)
    .maybeSingle();

  if (error || !data?.company_id) {
    return null;
  }

  const companyJoin = data.companies as
    | SupabaseProfileRow["companies"]
    | SupabaseProfileRow["companies"][]
    | null;
  const companyRow = Array.isArray(companyJoin) ? companyJoin[0] ?? null : companyJoin;

  const tenant = buildTenantContextFromSupabase(auth, {
    ...(data as Omit<SupabaseProfileRow, "companies">),
    companies: companyRow,
  });
  if (!tenant) return null;

  registerLiveTenantInMemoryStore(tenant);
  applyTenantContextToLegacyStores(tenant, auth);
  return tenant;
}
