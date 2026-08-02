"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/components/auth/permissions-provider";
import { SkillSwitcher } from "@/components/user-menu/SkillSwitcher";
import { cn } from "@/lib/utils";

const menuItems = [
  { emoji: "🔗", label: "Plattformen", href: "/plattformen" },
  { emoji: "👥", label: "Team", href: "/einstellungen/team" },
  { emoji: "⚙️", label: "Einstellungen", href: "/einstellungen" },
  { emoji: "❓", label: "Hilfe", href: "#" },
] as const;

type UserDropdownProps = {
  name: string;
  email: string;
  companyName: string | null;
  error: string | null;
  isSigningOut: boolean;
  gmailConnectionWarning?: boolean;
  onClose: () => void;
  onSignOut: () => void;
};

export function UserDropdown({
  name,
  email,
  companyName,
  error,
  isSigningOut,
  gmailConnectionWarning = false,
  onClose,
  onSignOut,
}: UserDropdownProps) {
  const { permissions } = usePermissions();

  return (
    <div
      role="menu"
      className="user-menu-enter min-w-[280px] overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)]/95 shadow-[0_16px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl"
    >
      <div className="border-b border-[var(--border)] px-4 py-3.5">
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {name}
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{email}</p>
        {companyName && (
          <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
            {companyName}
          </p>
        )}
      </div>

      <div className="border-b border-[var(--border)]">
        <SkillSwitcher />
      </div>

      {gmailConnectionWarning ? (
        <Link
          href="/plattformen"
          role="menuitem"
          onClick={onClose}
          className="flex items-center gap-2 border-b border-[#FDE68A]/60 bg-[#FFFBEB] px-4 py-2.5 text-[11px] font-medium text-[#B45309]"
        >
          <span className="size-2 shrink-0 rounded-full bg-[#F59E0B]" />
          Gmail-Verbindung prüfen
        </Link>
      ) : null}

      {error && (
        <p className="border-b border-[#FECACA]/60 bg-[#FEF2F2] px-4 py-2 text-[11px] text-[#DC2626]">
          {error}
        </p>
      )}

      <div className="py-1">
        {permissions?.isSuperAdmin ? (
          <Link
            href="/einstellungen/admin"
            role="menuitem"
            onClick={onClose}
            className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:pl-[1.125rem]"
          >
            <span className="text-[14px] leading-none">🛡️</span>
            Admin Panel
          </Link>
        ) : null}
        {menuItems.map(({ emoji, label, href }) => (
          <Link
            key={label}
            href={href}
            role="menuitem"
            onClick={onClose}
            className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:pl-[1.125rem]"
          >
            <span className="text-[14px] leading-none transition-transform duration-200 group-hover:scale-110">
              {emoji}
            </span>
            {label}
          </Link>
        ))}
      </div>

      <div className="border-t border-[var(--border)] py-1">
        <button
          type="button"
          role="menuitem"
          disabled={isSigningOut}
          onClick={onSignOut}
          className={cn(
            "group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:pl-[1.125rem]",
            isSigningOut && "opacity-70"
          )}
        >
          {isSigningOut ? (
            <Loader2 className="size-4 animate-spin text-[var(--text-secondary)]" />
          ) : (
            <span className="text-[14px] leading-none transition-transform duration-200 group-hover:scale-110">
              🚪
            </span>
          )}
          Abmelden
        </button>
      </div>
    </div>
  );
}
