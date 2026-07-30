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
    <div className="relative flex h-[100dvh] overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">

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
