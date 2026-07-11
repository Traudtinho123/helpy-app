import {
  MOCK_TENANT_COMPANY_ID,
  MOCK_TENANT_USER_ID,
} from "@/lib/tenant/mock/tenant-mock";
import type { TeamMember } from "@/lib/team/types/team-types";
import { resolveTeamPermissions } from "@/lib/team/services/team-permissions";

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    userId: MOCK_TENANT_USER_ID,
    companyId: MOCK_TENANT_COMPANY_ID,
    fullName: "Martina Traud",
    email: "martinasimova94@gmail.com",
    role: "OWNER",
    status: "active",
    avatar: null,
    permissions: resolveTeamPermissions("OWNER"),
    connectedPlatforms: {
      gmail: true,
      appleCalendar: false,
      googleCalendar: true,
    },
    lastActivity: "Gerade aktiv",
    createdAt: "2026-01-15T08:05:00+01:00",
  },
  {
    userId: "user-thomas-mueller",
    companyId: MOCK_TENANT_COMPANY_ID,
    fullName: "Thomas Müller",
    email: "thomas.mueller@traudt-immobilien.de",
    role: "ADMIN",
    status: "active",
    avatar: null,
    permissions: resolveTeamPermissions("ADMIN"),
    connectedPlatforms: {
      gmail: true,
      appleCalendar: true,
      googleCalendar: false,
    },
    lastActivity: "Vor 12 Minuten",
    createdAt: "2026-02-01T09:30:00+01:00",
  },
  {
    userId: "user-lisa-klein",
    companyId: MOCK_TENANT_COMPANY_ID,
    fullName: "Lisa Klein",
    email: "lisa.klein@traudt-immobilien.de",
    role: "EMPLOYEE",
    status: "deactivated",
    avatar: null,
    permissions: resolveTeamPermissions("EMPLOYEE"),
    connectedPlatforms: {
      gmail: false,
      appleCalendar: false,
      googleCalendar: false,
    },
    lastActivity: "Vor 3 Tagen",
    createdAt: "2026-02-10T14:00:00+01:00",
  },
];
