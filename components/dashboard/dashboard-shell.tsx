import { AiAssistantPanel } from "@/components/dashboard/ai-assistant-panel";
import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";

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
  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--background)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--background-secondary)] to-[var(--primary-light)]/30" />

      <div className="pointer-events-none fixed -top-40 -left-20 size-[600px] rounded-full bg-[var(--primary-glow)] blur-[130px]" />
      <div className="pointer-events-none fixed top-1/4 -right-32 size-[550px] rounded-full bg-[rgba(99,102,241,0.12)] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-32 left-1/4 size-[480px] rounded-full bg-[rgba(139,92,246,0.1)] blur-[110px]" />

      <Sidebar activeHref={activeHref} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
            {children}
          </main>
          <div className="hidden min-w-0 shrink-0 xl:flex">
            {rightPanel ?? <AiAssistantPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
