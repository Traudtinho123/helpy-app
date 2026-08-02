"use client";

import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { UserAvatar } from "@/components/user-menu/UserAvatar";
import { useUserProfileContext } from "@/lib/user/components/user-profile-context";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";

export function SidebarUserFooter() {
  const { profile } = useUserProfileContext();
  const { activeSkill } = useActiveSkill();
  const skillLabel = getSkillConfig(activeSkill).label.replace(/^HELPY\s/, "");

  const displayName =
    profile?.name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Nutzer";

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <UserAvatar
        name={displayName}
        email={profile?.email ?? ""}
        avatarUrl={profile?.avatarUrl}
        className="size-9"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
          {displayName}
        </p>
        <p className="truncate text-[11px] text-[var(--text-muted)]">
          {skillLabel} · Admin
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--success)]">
          <span className="helpy-pulse-dot size-1.5 rounded-full bg-[var(--success)]" />
          Aktiv
        </p>
      </div>
    </div>
  );
}
