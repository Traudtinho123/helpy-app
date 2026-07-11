import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";
import type { TeamMemberPermissions } from "@/lib/team/types/team-types";

export const ROLE_LABELS: Record<TenantUserRole, string> = {
  OWNER: "Inhaber",
  ADMIN: "Admin",
  EMPLOYEE: "Mitarbeiter",
};

export const ROLE_HELP_TEXT: Record<TenantUserRole, string> = {
  OWNER: "Volle Rechte im Unternehmen.",
  ADMIN: "Team verwalten, Mitarbeiter einladen, EMPLOYEE verwalten.",
  EMPLOYEE: "Keine Teamverwaltung.",
};

export function resolveTeamPermissions(
  role: TenantUserRole
): TeamMemberPermissions {
  switch (role) {
    case "OWNER":
      return {
        manageTeam: true,
        inviteMembers: true,
        manageEmployees: true,
      };
    case "ADMIN":
      return {
        manageTeam: true,
        inviteMembers: true,
        manageEmployees: true,
      };
    case "EMPLOYEE":
      return {
        manageTeam: false,
        inviteMembers: false,
        manageEmployees: false,
      };
  }
}

export function canManageTeam(role: TenantUserRole): boolean {
  return resolveTeamPermissions(role).manageTeam;
}
