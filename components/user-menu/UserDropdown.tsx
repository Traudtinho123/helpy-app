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
  onClose: () => void;
  onSignOut: () => void;
};

export function UserDropdown({
  name,
  email,
  companyName,
  error,
  isSigningOut,
  onClose,
  onSignOut,
}: UserDropdownProps) {
  const { permissions } = usePermissions();

  return (
    <div
      role="menu"
      className="user-menu-enter min-w-[280px] overflow-hidden rounded-[16px] border border-[#CBD5E1]/60 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl"
    >
      <div className="border-b border-[#CBD5E1]/40 px-4 py-3.5">
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          {name}
        </p>
        <p className="mt-1 text-[11px] text-[#64748B]">{email}</p>
        {companyName && (
          <p className="mt-1 text-[11px] font-medium text-[#475569]">
            {companyName}
          </p>
        )}
      </div>

      <div className="border-b border-[#CBD5E1]/40">
        <SkillSwitcher />
      </div>

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
            className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#334155] transition-all duration-200 hover:bg-[#F8FAFC] hover:pl-[1.125rem]"
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
            className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#334155] transition-all duration-200 hover:bg-[#F8FAFC] hover:pl-[1.125rem]"
          >
            <span className="text-[14px] leading-none transition-transform duration-200 group-hover:scale-110">
              {emoji}
            </span>
            {label}
          </Link>
        ))}
      </div>

      <div className="border-t border-[#CBD5E1]/40 py-1">
        <button
          type="button"
          role="menuitem"
          disabled={isSigningOut}
          onClick={onSignOut}
          className={cn(
            "group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#334155] transition-all duration-200 hover:bg-[#F8FAFC] hover:pl-[1.125rem]",
            isSigningOut && "opacity-70"
          )}
        >
          {isSigningOut ? (
            <Loader2 className="size-4 animate-spin text-[#64748B]" />
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
