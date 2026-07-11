import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";

export type TeamMemberStatus = "active" | "pending" | "deactivated";

export type TeamMemberPermissions = {
  manageTeam: boolean;
  inviteMembers: boolean;
  manageEmployees: boolean;
};

export type TeamConnectedPlatforms = {
  gmail: boolean;
  appleCalendar: boolean;
  googleCalendar: boolean;
};

export type TeamMember = {
  userId: string;
  companyId: string;
  fullName: string;
  email: string;
  role: TenantUserRole;
  status: TeamMemberStatus;
  avatar: string | null;
  permissions: TeamMemberPermissions;
  connectedPlatforms: TeamConnectedPlatforms;
  lastActivity: string;
  createdAt: string;
};

export type TeamInviteInput = {
  fullName: string;
  email: string;
  role: TenantUserRole;
};

export type TeamTimelineEntry = {
  id: string;
  at: string;
  label: string;
};

export type TeamActionResult =
  | { ok: true }
  | { ok: false; error: string };
