"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MoreVertical, UserPlus } from "lucide-react";
import { useCanInviteUsers, usePermissions } from "@/components/auth/permissions-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SettingsShell } from "@/components/settings/settings-shell";
import { TeamInviteModal } from "@/components/settings/team-invite-modal";
import {
  ROLE_HELP_TEXT,
  ROLE_LABELS,
} from "@/lib/team/services/team-permissions";
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
};

function TeamMemberRow({ member, isSelf }: TeamMemberRowProps) {
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
      </div>
    </div>
  );
}

function createPendingMember(input: {
  companyId: string;
  fullName: string;
  email: string;
  role: TenantUserRole;
}): TeamMember {
  return {
    userId: `pending-${input.email}`,
    companyId: input.companyId,
    fullName: input.fullName,
    email: input.email,
    role: input.role,
    status: "pending",
    avatar: null,
    permissions: {
      manageTeam: false,
      inviteMembers: false,
      manageEmployees: false,
    },
    connectedPlatforms: {
      gmail: false,
      appleCalendar: false,
      googleCalendar: false,
    },
    lastActivity: "Einladung ausstehend",
    createdAt: new Date().toISOString(),
  };
}

export function TeamSettingsForm() {
  const profile = useUserProfile();
  const { permissions } = usePermissions();
  const canInviteUsers = useCanInviteUsers();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canInvite =
    canInviteUsers ||
    profile.role === "owner" ||
    profile.role === "admin" ||
    permissions?.isSuperAdmin === true;

  const reloadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team/members", { cache: "no-store" });
      const payload = (await response.json()) as {
        members?: TeamMember[];
        error?: string;
      };

      if (!response.ok) {
        setMembers([]);
        setError(payload.error ?? "Team konnte nicht geladen werden.");
        return;
      }

      setMembers(payload.members ?? []);
    } catch {
      setMembers([]);
      setError("Team konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadMembers();
  }, [reloadMembers, profile.companyId]);

  const sortedMembers = useMemo(() => {
    const roleOrder: Record<TenantUserRole, number> = {
      OWNER: 0,
      ADMIN: 1,
      EMPLOYEE: 2,
    };

    return [...members].sort((left, right) => {
      const roleDiff = roleOrder[left.role] - roleOrder[right.role];
      if (roleDiff !== 0) return roleDiff;
      return left.fullName.localeCompare(right.fullName, "de");
    });
  }, [members]);

  const handleInvite = async (input: {
    fullName: string;
    email: string;
    role: TenantUserRole;
  }) => {
    setInviteLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Einladung fehlgeschlagen.");
        return;
      }

      const pendingMember = createPendingMember({
        companyId: profile.companyId,
        fullName: input.fullName,
        email: input.email,
        role: input.role,
      });

      setMembers((current) => {
        const normalized = input.email.trim().toLowerCase();
        const withoutDuplicate = current.filter(
          (member) => member.email.toLowerCase() !== normalized
        );
        return [...withoutDuplicate, pendingMember];
      });

      setInviteOpen(false);
      setFeedback(`Einladung an ${input.email} versendet.`);
    } catch {
      setError("Einladung konnte nicht versendet werden.");
    } finally {
      setInviteLoading(false);
    }
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
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-[#64748B]">
                <Loader2 className="size-4 animate-spin" />
                Team wird geladen…
              </div>
            ) : sortedMembers.length === 0 ? (
              <div className="px-5 py-8 text-[13px] text-[#64748B]">
                Noch keine Teammitglieder gefunden.
                {canInvite ? " Lade jetzt das erste Teammitglied ein." : null}
              </div>
            ) : (
              sortedMembers.map((member) => (
                <TeamMemberRow
                  key={member.userId}
                  member={member}
                  isSelf={member.userId === profile.userId}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TeamInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={(input) => void handleInvite(input)}
        loading={inviteLoading}
      />
    </SettingsShell>
  );
}
