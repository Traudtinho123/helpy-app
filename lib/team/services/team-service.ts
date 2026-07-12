import { MOCK_TEAM_MEMBERS } from "@/lib/team/mock/team-mock";
import { resolveTeamPermissions } from "@/lib/team/services/team-permissions";
import type {
  TeamActionResult,
  TeamInviteInput,
  TeamMember,
  TeamMemberStatus,
  TeamTimelineEntry,
} from "@/lib/team/types/team-types";
import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";

const listeners = new Set<() => void>();

let members: TeamMember[] = MOCK_TEAM_MEMBERS.map((member) => ({
  ...member,
  permissions: { ...member.permissions },
  connectedPlatforms: { ...member.connectedPlatforms },
}));

let timeline: TeamTimelineEntry[] = [];
let membersSnapshot: TeamMember[] = members;
let timelineSnapshot: TeamTimelineEntry[] = timeline;
let storeVersion = 0;

function cloneMember(member: TeamMember): TeamMember {
  return {
    ...member,
    permissions: { ...member.permissions },
    connectedPlatforms: { ...member.connectedPlatforms },
  };
}

function cloneMembers(list: TeamMember[]): TeamMember[] {
  return list.map(cloneMember);
}

function refreshSnapshots(): void {
  membersSnapshot = cloneMembers(members);
  timelineSnapshot = [...timeline];
  storeVersion += 1;
}

function notify(): void {
  refreshSnapshots();
  listeners.forEach((listener) => listener());
}

function appendTimeline(label: string): void {
  timeline = [
    ...timeline,
    {
      id: `team-timeline-${Date.now()}-${timeline.length}`,
      at: new Date().toISOString(),
      label,
    },
  ];
}

export function subscribeTeamStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTeamStoreVersion(): number {
  return storeVersion;
}

export function getTeamMembers(companyId: string): TeamMember[] {
  return cloneMembers(
    membersSnapshot.filter((member) => member.companyId === companyId)
  );
}

export function getTeamMembersSnapshot(companyId: string): TeamMember[] {
  return membersSnapshot.filter((member) => member.companyId === companyId);
}

export function getTeamTimeline(_companyId: string): TeamTimelineEntry[] {
  return [...timelineSnapshot];
}

/** Auth-UserId mit Team-Eintrag abgleichen (Mock — später DB). */
export function syncTeamActorFromAuth(
  userId: string,
  email: string | null
): void {
  if (!email) return;

  const normalized = email.trim().toLowerCase();
  let changed = false;

  members = members.map((member) => {
    if (member.email.toLowerCase() === normalized && member.userId !== userId) {
      changed = true;
      return { ...member, userId };
    }
    return member;
  });

  if (changed) {
    notify();
  }
}

/** Admin/Super-Admin als Team-Akteur anlegen, falls noch nicht im Mock-Store. */
export function ensureTeamActorFromAuth(input: {
  userId: string;
  email: string | null;
  companyId: string;
  fullName: string;
  canManageTeam: boolean;
  role?: TenantUserRole;
}): void {
  syncTeamActorFromAuth(input.userId, input.email);

  if (!input.canManageTeam || !input.email || !input.companyId) {
    return;
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingByUser = members.find((member) => member.userId === input.userId);
  const existingByEmail = members.find(
    (member) => member.email.toLowerCase() === normalizedEmail
  );

  if (existingByUser || existingByEmail) {
    return;
  }

  const role = input.role ?? "ADMIN";
  const nextMember: TeamMember = {
    userId: input.userId,
    companyId: input.companyId,
    fullName: input.fullName.trim() || input.email,
    email: input.email,
    role,
    status: "active",
    avatar: null,
    permissions: resolveTeamPermissions(role),
    connectedPlatforms: {
      gmail: false,
      appleCalendar: false,
      googleCalendar: false,
    },
    lastActivity: "Gerade aktiv",
    createdAt: new Date().toISOString(),
  };

  members = [...members, nextMember];
  notify();
}

export function getTeamMemberByUserId(userId: string): TeamMember | null {
  const member = membersSnapshot.find((item) => item.userId === userId);
  return member ? cloneMember(member) : null;
}

function countOwners(companyId: string): number {
  return members.filter(
    (member) =>
      member.companyId === companyId &&
      member.role === "OWNER" &&
      member.status !== "deactivated"
  ).length;
}

function findMember(userId: string): TeamMember | undefined {
  return members.find((member) => member.userId === userId);
}

function assertCanManageActor(actorUserId: string): TeamActionResult | null {
  const actor = findMember(actorUserId);
  if (!actor) {
    return { ok: false, error: "Teammitglied nicht gefunden." };
  }
  if (!actor.permissions.manageTeam) {
    return { ok: false, error: "Keine Berechtigung für Teamverwaltung." };
  }
  return null;
}

function assertOwnerProtection(
  targetUserId: string,
  actorUserId: string,
  action: "deactivate" | "remove" | "demote"
): TeamActionResult | null {
  const target = findMember(targetUserId);
  const actor = findMember(actorUserId);

  if (!target || !actor) {
    return { ok: false, error: "Teammitglied nicht gefunden." };
  }

  if (target.role === "OWNER" && target.userId === actorUserId) {
    if (action === "deactivate" || action === "remove") {
      return {
        ok: false,
        error: "Als Inhaber kannst du dich nicht selbst deaktivieren oder entfernen.",
      };
    }
  }

  if (
    target.role === "OWNER" &&
    action === "demote" &&
    countOwners(target.companyId) <= 1
  ) {
    return {
      ok: false,
      error: "Es muss mindestens ein Inhaber im Unternehmen bleiben.",
    };
  }

  return null;
}

export function inviteTeamMember(
  companyId: string,
  actorUserId: string,
  input: TeamInviteInput
): TeamActionResult {
  const denied = assertCanManageActor(actorUserId);
  if (denied) return denied;

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!fullName || !email) {
    return { ok: false, error: "Bitte Name und E-Mail ausfüllen." };
  }

  if (members.some((member) => member.email.toLowerCase() === email)) {
    return { ok: false, error: "Diese E-Mail ist bereits im Team vorhanden." };
  }

  if (input.role === "OWNER") {
    return { ok: false, error: "Neue Inhaber können derzeit nicht eingeladen werden." };
  }

  const userId = `invite-${Date.now()}`;
  const nextMember: TeamMember = {
    userId,
    companyId,
    fullName,
    email,
    role: input.role,
    status: "pending",
    avatar: null,
    permissions: resolveTeamPermissions(input.role),
    connectedPlatforms: {
      gmail: false,
      appleCalendar: false,
      googleCalendar: false,
    },
    lastActivity: "Einladung ausstehend",
    createdAt: new Date().toISOString(),
  };

  members = [...members, nextMember];
  appendTimeline(`Einladung vorbereitet für ${fullName}.`);
  notify();
  return { ok: true };
}

export function updateTeamMemberRole(
  targetUserId: string,
  actorUserId: string,
  role: TenantUserRole
): TeamActionResult {
  const denied = assertCanManageActor(actorUserId);
  if (denied) return denied;

  const target = findMember(targetUserId);
  if (!target) {
    return { ok: false, error: "Teammitglied nicht gefunden." };
  }

  if (role === "OWNER") {
    return { ok: false, error: "Inhaber-Rollen können derzeit nicht vergeben werden." };
  }

  if (target.role === "OWNER") {
    const protection = assertOwnerProtection(targetUserId, actorUserId, "demote");
    if (protection) return protection;
  }

  members = members.map((member) =>
    member.userId === targetUserId
      ? {
          ...member,
          role,
          permissions: resolveTeamPermissions(role),
        }
      : member
  );

  appendTimeline(`Rolle von ${target.fullName} geändert.`);
  notify();
  return { ok: true };
}

function setMemberStatus(
  targetUserId: string,
  actorUserId: string,
  status: TeamMemberStatus,
  timelineLabel: string
): TeamActionResult {
  const denied = assertCanManageActor(actorUserId);
  if (denied) return denied;

  const target = findMember(targetUserId);
  if (!target) {
    return { ok: false, error: "Teammitglied nicht gefunden." };
  }

  if (status === "deactivated") {
    const protection = assertOwnerProtection(targetUserId, actorUserId, "deactivate");
    if (protection) return protection;
  }

  members = members.map((member) =>
    member.userId === targetUserId
      ? {
          ...member,
          status,
          lastActivity:
            status === "active"
              ? "Gerade reaktiviert"
              : status === "deactivated"
                ? "Deaktiviert"
                : member.lastActivity,
        }
      : member
  );

  appendTimeline(timelineLabel);
  notify();
  return { ok: true };
}

export function deactivateTeamMember(
  targetUserId: string,
  actorUserId: string
): TeamActionResult {
  const target = findMember(targetUserId);
  return setMemberStatus(
    targetUserId,
    actorUserId,
    "deactivated",
    `${target?.fullName ?? "Teammitglied"} deaktiviert.`
  );
}

export function reactivateTeamMember(
  targetUserId: string,
  actorUserId: string
): TeamActionResult {
  const target = findMember(targetUserId);
  return setMemberStatus(
    targetUserId,
    actorUserId,
    "active",
    `${target?.fullName ?? "Teammitglied"} reaktiviert.`
  );
}

export function removeTeamMember(
  targetUserId: string,
  actorUserId: string
): TeamActionResult {
  const denied = assertCanManageActor(actorUserId);
  if (denied) return denied;

  const target = findMember(targetUserId);
  if (!target) {
    return { ok: false, error: "Teammitglied nicht gefunden." };
  }

  const protection = assertOwnerProtection(targetUserId, actorUserId, "remove");
  if (protection) return protection;

  members = members.filter((member) => member.userId !== targetUserId);
  appendTimeline(`${target.fullName} aus dem Team entfernt (Mock).`);
  notify();
  return { ok: true };
}

// Initial snapshot
refreshSnapshots();
