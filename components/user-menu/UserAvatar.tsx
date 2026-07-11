"use client";

import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  onClick?: () => void;
  isOpen?: boolean;
  className?: string;
};

function getInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  onClick,
  isOpen = false,
  className,
}: UserAvatarProps) {
  const initials = getInitials(name, email);
  const hasImage = Boolean(avatarUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Benutzerprofil öffnen"
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={cn(
        "group relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-xs font-semibold text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)] ring-2 ring-white transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_6px_20px_rgba(15,23,42,0.32)] active:scale-[0.98]",
        isOpen && "scale-[1.04] shadow-[0_6px_20px_rgba(15,23,42,0.32)]",
        className
      )}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl!}
          alt={name}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="relative z-[1] tracking-[-0.02em]">{initials}</span>
      )}

      <span className="absolute -right-0.5 -bottom-0.5 z-[2] size-2.5 rounded-full border-2 border-white bg-[#10B981] transition-transform duration-300 group-hover:scale-110" />
    </button>
  );
}
