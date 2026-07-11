"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  Hammer,
  Mail,
  Phone,
  Send,
  ShieldAlert,
  Sparkles,
  UserPlus,
} from "lucide-react";
import {
  getNotificationBellServerSnapshot,
  getNotificationBellSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from "@/features/notifications/services/notification-store";
import type {
  HelpyNotification,
  HelpyNotificationKind,
} from "@/features/notifications/types/notification-types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

const kindIcons: Record<HelpyNotificationKind, typeof Bell> = {
  anfrage: Building2,
  baustellen_anfrage: Hammer,
  neuer_kunde: UserPlus,
  angebot_vorbereitet: FileText,
  spam_archiv: ShieldAlert,
  gmail_entwurf: Mail,
  gmail_gesendet: Send,
  kalender_termin: CalendarDays,
  followup_kunde_wartet: Clock,
  followup_angebot_offen: FileText,
  voice_notfall: Phone,
  voice_anruf: Phone,
};

function NotificationItem({
  item,
  onNavigate,
}: {
  item: HelpyNotification;
  onNavigate: () => void;
}) {
  const Icon = kindIcons[item.kind] ?? Sparkles;

  return (
    <Link
      href={item.href}
      onClick={() => {
        markNotificationRead(item.id);
        onNavigate();
      }}
      className={cn(
        "flex gap-3 rounded-[14px] px-3 py-3 transition-colors hover:bg-[#F8FAFC]",
        !item.read && "bg-[#EFF6FF]/50"
      )}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#FAF5FF] text-[#7C3AED]">
        <Icon className="size-3.5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-semibold text-[#0F172A]">{item.title}</p>
          {!item.read && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#EF4444]" />
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#64748B]">
          {item.message}
        </p>
      </div>
    </Link>
  );
}

export function HelpyNotificationBell() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });

  const { unreadCount, grouped, hasNotifications } = useExternalStore(
    subscribeNotifications,
    getNotificationBellSnapshot,
    getNotificationBellServerSnapshot
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPosition({
      top: rect.bottom + 10,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    document.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!open) {
      markAllNotificationsRead();
    }
    setOpen((current) => !current);
  }, [open]);

  const panel =
    open && mounted ? (
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: panelPosition.top,
          right: panelPosition.right,
          zIndex: 200,
        }}
        className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[20px] border border-[#CBD5E1]/50 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      >
        <div className="border-b border-[#E2E8F0]/80 bg-gradient-to-r from-[#FAF5FF]/80 to-[#EFF6FF]/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-[#7C3AED]" strokeWidth={2.2} />
            <p className="text-[13px] font-semibold text-[#0F172A]">
              HELPY Meldungen
            </p>
          </div>
          <p className="mt-1 text-[11px] text-[#64748B]">
            Interne Hinweise — keine Browser-Benachrichtigungen
          </p>
        </div>

        <div className="max-h-[min(28rem,70vh)] overflow-y-auto p-2">
          {!hasNotifications || grouped.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[12px] font-medium text-[#64748B]">
                Keine Meldungen
              </p>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                HELPY informiert dich hier über neue Vorgänge.
              </p>
            </div>
          ) : (
            grouped.map((section) => (
              <div key={section.group} className="mb-2 last:mb-0">
                <p className="px-3 py-2 text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="relative z-[110]" ref={triggerRef}>
        <button
          type="button"
          aria-label="HELPY Meldungen"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={handleToggle}
          className={cn(
            "relative flex size-10 items-center justify-center rounded-full border border-[#CBD5E1]/60 bg-white/90 text-[#475569] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-[#BFDBFE]/70 hover:bg-[#EFF6FF]/50 hover:text-[#2563EB]",
            open && "border-[#BFDBFE]/70 bg-[#EFF6FF]/50 text-[#2563EB]"
          )}
        >
          <Bell className="size-[17px]" strokeWidth={2.2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(239,68,68,0.45)]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {panel && createPortal(panel, document.body)}
    </>
  );
}
