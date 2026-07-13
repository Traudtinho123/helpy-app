import { AiAssistantPanel } from "@/components/dashboard/ai-assistant-panel";
import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { HelpyChatFab } from "@/components/mobile/helpy-chat-fab";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { PwaInstallBanner } from "@/components/mobile/pwa-install-banner";
import { ViewingReminderScheduler } from "@/components/viewing-reminder-scheduler";

type DashboardShellProps = {
  children: React.ReactNode;
  activeHref?: string;
  rightPanel?: React.ReactNode;
};

export function DashboardShell({
  children,
  activeHref = "/",
  rightPanel,
}: DashboardShellProps) {
  const helpyPanel = rightPanel ?? <AiAssistantPanel />;

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-[var(--background)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--background-secondary)] to-[var(--primary-light)]/30" />

      <div className="pointer-events-none fixed -top-40 -left-20 size-[600px] rounded-full bg-[var(--primary-glow)] blur-[130px]" />
      <div className="pointer-events-none fixed top-1/4 -right-32 size-[550px] rounded-full bg-[rgba(99,102,241,0.12)] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-32 left-1/4 size-[480px] rounded-full bg-[rgba(139,92,246,0.1)] blur-[110px]" />

      <Sidebar activeHref={activeHref} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <MobileHeader />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <PullToRefresh className="helpy-layout-main relative min-w-0 flex-1 bg-transparent pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
            <main className="relative min-h-full min-w-0 overflow-x-hidden">
              {children}
            </main>
          </PullToRefresh>
          <div className="hidden min-w-0 shrink-0 xl:flex">{helpyPanel}</div>
        </div>

        <HelpyChatFab panel={helpyPanel} />
        <MobileBottomNav activeHref={activeHref} />
        <PwaInstallBanner />
        <ViewingReminderScheduler />
      </div>
    </div>
  );
}
