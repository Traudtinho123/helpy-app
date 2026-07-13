"use client";

import { SlideUpSheet } from "@/components/mobile/slide-up-sheet";
import { useEffect } from "react";

export const VORGAENGE_SHORTCUTS = [
  { key: "E", label: "Ausgewählten Vorgang als erledigt markieren" },
  { key: "R", label: "Antwort-Panel öffnen" },
  { key: "T", label: "Termin-Panel öffnen" },
  { key: "Escape", label: "Vorgang / Panel schliessen" },
  { key: "↑ / ↓", label: "Zwischen Vorgängen navigieren" },
  { key: "Space", label: "Vorgang öffnen / schliessen" },
  { key: "?", label: "Shortcut-Übersicht anzeigen" },
] as const;

type VorgaengeKeyboardShortcutsProps = {
  enabled: boolean;
  onComplete: () => void;
  onReply: () => void;
  onAppointment: () => void;
  onEscape: () => void;
  onNavigate: (direction: "up" | "down") => void;
  onToggleOpen: () => void;
  onShowHelp: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function VorgaengeKeyboardShortcuts({
  enabled,
  onComplete,
  onReply,
  onAppointment,
  onEscape,
  onNavigate,
  onToggleOpen,
  onShowHelp,
}: VorgaengeKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        onShowHelp();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key === "e" || event.key === "E") {
        event.preventDefault();
        onComplete();
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        onReply();
        return;
      }

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        onAppointment();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        onNavigate("up");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        onNavigate("down");
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        onToggleOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    onAppointment,
    onComplete,
    onEscape,
    onNavigate,
    onReply,
    onShowHelp,
    onToggleOpen,
  ]);

  return null;
}

type ShortcutsHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutsHelpModal({ open, onClose }: ShortcutsHelpModalProps) {
  return (
    <>
      <SlideUpSheet open={open} onClose={onClose} title="Tastaturkürzel" className="lg:hidden">
        <div className="p-4 pb-8">
          <p className="mb-4 text-[12px] text-[#64748B]">
            Schnellaktionen auf der Vorgänge-Seite (Desktop)
          </p>
          <ul className="space-y-2">
            {VORGAENGE_SHORTCUTS.map((shortcut) => (
              <li
                key={shortcut.key}
                className="flex items-center justify-between gap-4 text-[13px]"
              >
                <span className="text-[#475569]">{shortcut.label}</span>
                <kbd className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                  {shortcut.key}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      </SlideUpSheet>

      {open ? (
    <div
      className="fixed inset-0 z-50 hidden items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm lg:flex"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Tastaturkürzel
        </h2>
        <p className="mt-1 text-[12px] text-[#64748B]">
          Schnellaktionen auf der Vorgänge-Seite (Desktop)
        </p>
        <ul className="mt-4 space-y-2">
          {VORGAENGE_SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.key}
              className="flex items-center justify-between gap-4 text-[13px]"
            >
              <span className="text-[#475569]">{shortcut.label}</span>
              <kbd className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                {shortcut.key}
              </kbd>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-[12px] bg-[#2563EB] py-2.5 text-[13px] font-semibold text-white"
        >
          Schliessen
        </button>
      </div>
    </div>
      ) : null}
    </>
  );
}
