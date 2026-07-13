"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "helpy-pwa-install-dismissed-v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);

    if (isStandalone) return;

    setVisible(true);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      dismiss();
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-3 z-[60] rounded-[16px] border border-[#C7D2FE]/60 bg-white p-4 shadow-lg",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:hidden"
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 flex size-11 items-center justify-center text-[#94A3B8]"
        aria-label="Schliessen"
      >
        <X className="size-4" />
      </button>
      <p className="pr-8 text-[14px] font-semibold text-[#0F172A]">
        📱 HELPY als App installieren
      </p>
      <p className="mt-1 text-[12px] text-[#64748B]">
        Schneller Zugriff vom Homescreen — wie eine native App.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            void handleInstall();
          }}
          className="helpy-btn-primary min-h-[44px] flex-1 rounded-[12px] px-4 text-[13px] font-semibold"
        >
          Installieren
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-[44px] flex-1 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-[13px] font-medium text-[#64748B]"
        >
          Später
        </button>
      </div>
    </div>
  );
}
