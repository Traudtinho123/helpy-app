import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

/** Mandanten-Rolle — entspricht später user_profile.role in der DB. */
export type TenantUserRole = "OWNER" | "ADMIN" | "EMPLOYEE";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "pending";

/** Entität: company */
export type Company = {
  id: string;
  companyName: string;
  industry: string;
  subscriptionPlan: string;
  activeHelpyProfile: HelpySkill;
  createdAt: string;
};

/** Entität: user_profile — verknüpft Supabase Auth mit Mandant. */
export type TenantUserProfile = {
  userId: string;
  companyId: string;
  fullName: string;
  role: TenantUserRole;
  avatar: string | null;
  createdAt: string;
};

/** Entität: user_connections — persönliche Plattformen pro Benutzer. */
export type UserConnections = {
  userId: string;
  gmailConnected: boolean;
  appleCalendarConnected: boolean;
  googleCalendarConnected: boolean;
  outlookConnected: boolean;
  lastSync: string | null;
  connectionStatus: ConnectionStatus;
};

export type CompanyBranding = {
  primaryColor: string;
  secondaryColor: string;
  logoInitials: string;
};

export type TenantNotificationSettings = {
  email: boolean;
  push: boolean;
  digest: boolean;
};

/** Entität: company_settings — Unternehmensweite Einstellungen. */
export type CompanySettings = {
  companyId: string;
  logo: string | null;
  branding: CompanyBranding;
  workingHours: {
    start: string;
    end: string;
  };
  emailTemplates: string[];
  activePlatforms: string[];
  brainProfile: HelpySkill;
  notificationSettings: TenantNotificationSettings;
};

export type TenantContext = {
  userProfile: TenantUserProfile;
  company: Company;
  userConnections: UserConnections;
  companySettings: CompanySettings;
};

export type SupabaseAuthIdentity = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};
