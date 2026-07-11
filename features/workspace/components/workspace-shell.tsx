import { FocusBar } from "@/features/workspace/components/focus-bar";
import { GmailWorkspaceActionsProvider } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-actions-context";
import { GmailWorkspaceHelpyPanel } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-helpy-panel";
import { WorkspaceFlowProvider } from "@/features/workspace/components/workspace-flow-context";
import { VorgangWorkspace } from "@/features/workspace/components/vorgang-workspace";
import { WorkspaceHelpyPanel } from "@/features/workspace/components/workspace-helpy-panel";
import { WorkspaceMiniSidebar } from "@/features/workspace/components/workspace-mini-sidebar";
import { WorkspaceSkillSync } from "@/features/workspace/components/workspace-skill-sync";
import { WorkspaceContextProvider } from "@/features/workspace/context/workspace-context-provider";
import { WorkspacePanelProvider } from "@/features/workspace/panels/workspace-panel-provider";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type WorkspaceShellProps = {
  vorgang: Vorgang;
};

export function WorkspaceShell({ vorgang }: WorkspaceShellProps) {
  const isMail = isConnectedMailVorgang(vorgang);

  const content = (
    <div className="relative flex h-screen overflow-hidden bg-[#EEF4FC] text-[#0F172A]">
      <WorkspaceSkillSync />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#EEF4FC] via-[#E8F0FA] to-[#DBEAFE]/40" />
      <div className="pointer-events-none fixed -top-40 -left-20 size-[600px] rounded-full bg-[#2563EB]/15 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/4 -right-32 size-[550px] rounded-full bg-[#3B82F6]/12 blur-[120px]" />

      <WorkspaceMiniSidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <FocusBar vorgang={vorgang} />

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <VorgangWorkspace vorgang={vorgang} />
          </main>
          {isMail ? (
            <GmailWorkspaceHelpyPanel vorgang={vorgang} />
          ) : (
            <WorkspaceHelpyPanel vorgang={vorgang} />
          )}
        </div>
      </div>
    </div>
  );

  if (isMail) {
    return (
      <GmailWorkspaceActionsProvider>
        <WorkspaceFlowProvider vorgang={vorgang}>
          <WorkspaceContextProvider vorgang={vorgang}>
            <WorkspacePanelProvider>{content}</WorkspacePanelProvider>
          </WorkspaceContextProvider>
        </WorkspaceFlowProvider>
      </GmailWorkspaceActionsProvider>
    );
  }

  return (
    <WorkspaceFlowProvider vorgang={vorgang}>
      <WorkspaceContextProvider vorgang={vorgang}>
        <WorkspacePanelProvider>{content}</WorkspacePanelProvider>
      </WorkspaceContextProvider>
    </WorkspaceFlowProvider>
  );
}
