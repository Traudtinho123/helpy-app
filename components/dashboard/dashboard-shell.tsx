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
    <div className="relative flex h-screen overflow-hidden bg-[#EEF4FC] text-[#0F172A]">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#EEF4FC] via-[#E8F0FA] to-[#DBEAFE]/40" />

      <div className="pointer-events-none fixed -top-40 -left-20 size-[600px] rounded-full bg-[#2563EB]/15 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/4 -right-32 size-[550px] rounded-full bg-[#3B82F6]/12 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-32 left-1/4 size-[480px] rounded-full bg-[#60A5FA]/18 blur-[110px]" />
      <div className="pointer-events-none fixed top-2/3 left-1/2 size-[360px] -translate-x-1/2 rounded-full bg-white/50 blur-[90px]" />

      <Sidebar activeHref={activeHref} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
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
