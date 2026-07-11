"use client";

import { createContext, useContext } from "react";
import { useWorkspaceWorkflow } from "@/features/workflow/services/automation/use-workspace-workflow";
import type { DecisionResult } from "@/features/workspace/services/decision";
import type { WorkflowInstance } from "@/features/workflow/services/automation";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type WorkspaceFlowContextValue = {
  decision: DecisionResult;
  opened: boolean;
  instance: WorkflowInstance | null;
  feedback: string | null;
  openWorkflow: () => void;
  handleStepAction: (stepId: string, action: "pruefen" | "bestaetigen") => void;
};

const WorkspaceFlowContext = createContext<WorkspaceFlowContextValue | null>(
  null
);

export function WorkspaceFlowProvider({
  vorgang,
  children,
}: {
  vorgang: Vorgang;
  children: React.ReactNode;
}) {
  const flow = useWorkspaceWorkflow(vorgang);

  return (
    <WorkspaceFlowContext.Provider value={flow}>
      {children}
    </WorkspaceFlowContext.Provider>
  );
}

export function useWorkspaceFlow(): WorkspaceFlowContextValue {
  const context = useContext(WorkspaceFlowContext);
  if (!context) {
    throw new Error("useWorkspaceFlow must be used within WorkspaceFlowProvider");
  }
  return context;
}
