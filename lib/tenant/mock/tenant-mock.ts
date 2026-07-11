import type {
  Company,
  CompanySettings,
  TenantUserProfile,
  UserConnections,
} from "@/lib/tenant/types/tenant-types";

export const MOCK_TENANT_COMPANY_ID = "helpy-demo-company";

/** Demo-User — wird per userId aufgelöst, nicht per E-Mail. */
export const MOCK_TENANT_USER_ID = "user-martina-traudt";

export const MOCK_COMPANY: Company = {
  id: MOCK_TENANT_COMPANY_ID,
  companyName: "Traudt Immobilien GmbH",
  industry: "Immobilien",
  subscriptionPlan: "HELPY Real Estate Pro",
  activeHelpyProfile: "real-estate",
  createdAt: "2026-01-15T08:00:00+01:00",
};

export const MOCK_TENANT_USER_PROFILE: TenantUserProfile = {
  userId: MOCK_TENANT_USER_ID,
  companyId: MOCK_TENANT_COMPANY_ID,
  fullName: "Martina Traut",
  role: "OWNER",
  avatar: null,
  createdAt: "2026-01-15T08:05:00+01:00",
};

export const MOCK_USER_CONNECTIONS: UserConnections = {
  userId: MOCK_TENANT_USER_ID,
  gmailConnected: true,
  appleCalendarConnected: false,
  googleCalendarConnected: true,
  outlookConnected: false,
  lastSync: "vor 2 Minuten",
  connectionStatus: "connected",
};

export const MOCK_COMPANY_SETTINGS: CompanySettings = {
  companyId: MOCK_TENANT_COMPANY_ID,
  logo: null,
  branding: {
    primaryColor: "#1E3A8A",
    secondaryColor: "#3B82F6",
    logoInitials: "TI",
  },
  workingHours: {
    start: "08:00",
    end: "18:00",
  },
  emailTemplates: ["angebot", "offerte", "rechnung"],
  activePlatforms: [
    "gmail",
    "immoscout24",
    "homegate",
    "newhome",
    "website-formulare",
    "apple-calendar",
    "google-calendar",
  ],
  brainProfile: "real-estate",
  notificationSettings: {
    email: true,
    push: true,
    digest: false,
  },
};

/** Mock-Store — später durch Supabase ersetzt. */
export const TENANT_COMPANIES: Record<string, Company> = {
  [MOCK_COMPANY.id]: MOCK_COMPANY,
};

export const TENANT_USER_PROFILES: Record<string, TenantUserProfile> = {
  [MOCK_TENANT_USER_PROFILE.userId]: MOCK_TENANT_USER_PROFILE,
};

export const TENANT_USER_CONNECTIONS: Record<string, UserConnections> = {
  [MOCK_USER_CONNECTIONS.userId]: MOCK_USER_CONNECTIONS,
};

export const TENANT_COMPANY_SETTINGS: Record<string, CompanySettings> = {
  [MOCK_COMPANY_SETTINGS.companyId]: MOCK_COMPANY_SETTINGS,
};
