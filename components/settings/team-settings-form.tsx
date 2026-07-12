"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, UserPlus } from "lucide-react";
import { useCanInviteUsers } from "@/components/auth/permissions-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SettingsShell } from "@/components/settings/settings-shell";
import { TeamInviteModal } from "@/components/settings/team-invite-modal";
import {
  canManageTeam,
  ROLE_HELP_TEXT,
  ROLE_LABELS,
} from "@/lib/team/services/team-permissions";
import {
  deactivateTeamMember,
  getTeamMembersSnapshot,
  getTeamTimeline,
  inviteTeamMember,
  reactivateTeamMember,
  removeTeamMember,
  subscribeTeamStore,
  syncTeamActorFromAuth,
  updateTeamMemberRole,
} from "@/lib/team/services/team-service";
import type { TeamMember, TeamMemberStatus } from "@/lib/team/types/team-types";
import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";
import { useUserProfile } from "@/lib/user/components/user-profile-context";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: TeamMemberStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0]/60 bg-[#ECFDF5]/70 px-2.5 py-0.5 text-[10px] font-semibold text-[#047857]">
        🟢 Aktiv
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#FDE68A]/60 bg-[#FFFBEB]/70 px-2.5 py-0.5 text-[10px] font-semibold text-[#B45309]">
        🟡 Einladung ausstehend
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-2.5 py-0.5 text-[10px] font-semibold text-[#64748B]">
      ⚪ Deaktiviert
    </span>
  );
}

function PlatformIcons({
  platforms,
}: {
  platforms: TeamMember["connectedPlatforms"];
}) {
  const items = [
    { emoji: "📧", label: "Gmail", connected: platforms.gmail },
    { emoji: "🍎", label: "Apple Kalender", connected: platforms.appleCalendar },
    { emoji: "📅", label: "Google Kalender", connected: platforms.googleCalendar },
  ];

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          title={item.label}
          className={cn(
            "text-[14px] leading-none",
            item.connected ? "opacity-100" : "opacity-30 grayscale"
          )}
          aria-label={item.label}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}

type TeamMemberRowProps = {
  member: TeamMember;
  isSelf: boolean;
  canManage: boolean;
  onChangeRole: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onReactivate: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
};

function TeamMemberRow({
  member,
  isSelf,
  canManage,
  onChangeRole,
  onDeactivate,
  onReactivate,
  onRemove,
}: TeamMemberRowProps) {
  const showActions = canManage && !(isSelf && member.role === "OWNER");

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        <Avatar helpy={false} name={member.fullName} src={member.avatar ?? undefined} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A]">
                {member.fullName}
                {isSelf && (
                  <span className="ml-2 text-[11px] font-medium text-[#64748B]">(Du)</span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-[#64748B]">{member.email}</p>
            </div>
            <StatusBadge status={member.status} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                Rolle
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-[#334155]">
                {ROLE_LABELS[member.role]}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#94A3B8]">
                {ROLE_HELP_TEXT[member.role]}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                Verbunden
              </p>
              <div className="mt-1.5">
                <PlatformIcons platforms={member.connectedPlatforms} />
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[#64748B]">
            Letzte Aktivität: {member.lastActivity}
          </p>
        </div>

        {showActions && (
          <Dropdown
            align="end"
            trigger={
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-[10px] border border-[#CBD5E1]/60 bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
                aria-label="Aktionen"
              >
                <MoreVertical className="size-4" strokeWidth={2} />
              </button>
            }
          >
            <DropdownItem onClick={() => onChangeRole(member)}>
              Rolle ändern
            </DropdownItem>
            {member.status === "active" || member.status === "pending" ? (
              <DropdownItem onClick={() => onDeactivate(member)}>
                Deaktivieren
              </DropdownItem>
            ) : (
              <DropdownItem onClick={() => onReactivate(member)}>
                Reaktivieren
              </DropdownItem>
            )}
            <DropdownItem
              className="text-[#B91C1C] hover:bg-[#FEF2F2]"
              onClick={() => onRemove(member)}
            >
              Entfernen
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

export function TeamSettingsForm() {
  const profile = useUserProfile();
  const [tick, setTick] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<TeamMember | null>(null);
  const [roleValue, setRoleValue] = useState<TenantUserRole>("EMPLOYEE");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    syncTeamActorFromAuth(profile.userId, profile.email);
  }, [profile.email, profile.userId]);

  useEffect(() => subscribeTeamStore(() => setTick((value) => value + 1)), []);

  const members = useMemo(
    () => getTeamMembersSnapshot(profile.companyId),
    [profile.companyId, tick]
  );

  const timeline = useMemo(() => getTeamTimeline(profile.companyId), [profile.companyId, tick]);

  const actor = useMemo(
    () => members.find((member) => member.userId === profile.userId) ?? null,
    [members, profile.userId]
  );

  const canManage = actor ? canManageTeam(actor.role) : false;
  const canInviteUsers = useCanInviteUsers();
  const canInvite = canManage && canInviteUsers;

  const handleInvite = (input: { fullName: string; email: string; role: TenantUserRole }) => {
    const result = inviteTeamMember(profile.companyId, profile.userId, input);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setInviteOpen(false);
    setError(null);
    setFeedback("Einladung vorbereitet.");
  };

  const runAction = (
    action: () => { ok: true } | { ok: false; error: string },
    successMessage: string
  ) => {
    const result = action();
    if (!result.ok) {
      setError(result.error);
      setFeedback(null);
      return;
    }
    setError(null);
    setFeedback(successMessage);
  };

  return (
    <SettingsShell
      title="Team"
      description="Teammitglieder deines Unternehmens und deren Rollen."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {canInvite && (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="h-10 gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 text-[12px] font-semibold text-white shadow-sm"
            >
              <UserPlus className="size-4" strokeWidth={2} />
              Mitarbeiter einladen
            </Button>
          </div>
        )}

        {(feedback || error) && (
          <p
            className={cn(
              "rounded-[12px] px-3.5 py-2.5 text-[11px] leading-relaxed",
              error
                ? "border border-[#FECACA]/60 bg-[#FEF2F2]/70 text-[#B91C1C]"
                : "border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 text-[#047857]"
            )}
          >
            {error ?? feedback}
          </p>
        )}

        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Teammitglieder
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[#CBD5E1]/30 p-0">
            {members.map((member) => (
              <TeamMemberRow
                key={member.userId}
                member={member}
                isSelf={member.userId === profile.userId}
                canManage={canManage}
                onChangeRole={(target) => {
                  setRoleTarget(target);
                  setRoleValue(target.role === "OWNER" ? "ADMIN" : target.role);
                }}
                onDeactivate={(target) =>
                  runAction(
                    () => deactivateTeamMember(target.userId, profile.userId),
                    `${target.fullName} deaktiviert.`
                  )
                }
                onReactivate={(target) =>
                  runAction(
                    () => reactivateTeamMember(target.userId, profile.userId),
                    `${target.fullName} reaktiviert.`
                  )
                }
                onRemove={(target) =>
                  runAction(
                    () => removeTeamMember(target.userId, profile.userId),
                    `${target.fullName} entfernt.`
                  )
                }
              />
            ))}
          </CardContent>
        </Card>

        {timeline.length > 0 && (
          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
            <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
              <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
                Verlauf
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-[#CBD5E1]/30">
                {[...timeline].reverse().map((entry) => (
                  <li
                    key={entry.id}
                    className="px-5 py-3 text-[12px] leading-relaxed text-[#334155]"
                  >
                    {entry.label}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <TeamInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />

      <Modal
        open={Boolean(roleTarget)}
        title="Rolle ändern"
        description={
          roleTarget ? `Rolle für ${roleTarget.fullName} anpassen.` : undefined
        }
        onClose={() => setRoleTarget(null)}
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRoleTarget(null)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white"
              onClick={() => {
                if (!roleTarget) return;
                runAction(
                  () =>
                    updateTeamMemberRole(roleTarget.userId, profile.userId, roleValue),
                  `Rolle von ${roleTarget.fullName} geändert.`
                );
                setRoleTarget(null);
              }}
            >
              Speichern
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">Neue Rolle</label>
          <Select
            value={roleValue}
            onChange={(event) => setRoleValue(event.target.value as TenantUserRole)}
            className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[13px]"
          >
            <option value="EMPLOYEE">{ROLE_LABELS.EMPLOYEE}</option>
            <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
          </Select>
          <p className="text-[10px] leading-relaxed text-[#94A3B8]">
            {ROLE_HELP_TEXT[roleValue]}
          </p>
        </div>
      </Modal>
    </SettingsShell>
  );
}
