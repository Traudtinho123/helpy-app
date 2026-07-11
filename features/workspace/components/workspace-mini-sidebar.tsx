"use client";

import Link from "next/link";
import { ArrowLeft, Focus, LayoutDashboard, Inbox } from "lucide-react";
import { usePathname } from "next/navigation";
import { HelpyLogo } from "@/components/helpy/helpy-logo";
import { resolveCoreNavActiveHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type WorkspaceMiniSidebarProps = {
  className?: string;
};

export function WorkspaceMiniSidebar({ className }: WorkspaceMiniSidebarProps) {
  const pathname = usePathname() ?? "/";
  const activeHref = resolveCoreNavActiveHref(pathname);

  return (
    <aside
      className={cn(
        "relative z-10 flex h-screen w-[72px] shrink-0 flex-col items-center border-r border-white/[0.08] bg-gradient-to-b from-[#0F172A] via-[#152347] to-[#0F172A] py-5 shadow-[4px_0_32px_rgba(15,23,42,0.18)]",
        className
      )}
    >
      <Link href="/" className="mb-8 flex size-10 items-center justify-center" title="HELPY">
        <HelpyLogo size="sm" variant="light" showSubtitle={false} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        <Link
          href="/"
          title="Mein Arbeitstag"
          className={cn(
            "flex size-11 items-center justify-center rounded-[14px] transition-all duration-300",
            activeHref === "/"
              ? "bg-[#2563EB]/20 text-[#93C5FD] ring-1 ring-[#3B82F6]/40"
              : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <LayoutDashboard className="size-[18px]" strokeWidth={2} />
        </Link>
        <Link
          href="/vorgaenge"
          title="Vorgänge"
          className={cn(
            "flex size-11 items-center justify-center rounded-[14px] transition-all duration-300",
            activeHref === "/vorgaenge"
              ? "bg-[#2563EB]/20 text-[#93C5FD] ring-1 ring-[#3B82F6]/40"
              : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <Inbox className="size-[18px]" strokeWidth={2} />
        </Link>
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3">
        <div
          className="flex size-11 items-center justify-center rounded-[14px] bg-[#2563EB]/20 text-[#93C5FD] ring-1 ring-[#3B82F6]/40"
          title="Focus Mode aktiv"
        >
          <Focus className="size-[18px]" strokeWidth={2} />
        </div>
        <Link
          href="/vorgaenge"
          title="Focus Mode beenden"
          className="flex size-11 items-center justify-center rounded-[14px] text-slate-400 transition-all duration-300 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2} />
        </Link>
      </div>
    </aside>
  );
}
