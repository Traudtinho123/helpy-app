"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WorkspacePanelSlideOver } from "@/features/workspace/panels/workspace-panel";
import {
  closeWorkspacePanel,
  getActiveWorkspacePanel,
  getWorkspacePanelStack,
  openWorkspacePanel,
  replaceWorkspacePanel,
  subscribeWorkspacePanels,
} from "@/features/workspace/panels/workspace-panel-stack";
import type {
  AnyWorkspacePanel,
  OpenWorkspacePanelInput,
  WorkspacePanel,
  WorkspacePanelKind,
} from "@/features/workspace/panels/workspace-panel-types";

type WorkspacePanelContextValue = {
  activePanel: AnyWorkspacePanel | null;
  stack: readonly AnyWorkspacePanel[];
  openPanel: <K extends WorkspacePanelKind>(
    input: OpenWorkspacePanelInput<K>
  ) => WorkspacePanel<K>;
  closePanel: () => void;
  replacePanel: <K extends WorkspacePanelKind>(
    input: OpenWorkspacePanelInput<K>
  ) => WorkspacePanel<K>;
};

const WorkspacePanelContext = createContext<WorkspacePanelContextValue | null>(
  null
);

export function WorkspacePanelProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);

  useEffect(
    () =>
      subscribeWorkspacePanels(() => {
        setRevision((value) => value + 1);
      }),
    []
  );

  const value = useMemo<WorkspacePanelContextValue>(
    () => ({
      activePanel: getActiveWorkspacePanel(),
      stack: getWorkspacePanelStack(),
      openPanel: openWorkspacePanel,
      closePanel: closeWorkspacePanel,
      replacePanel: replaceWorkspacePanel,
    }),
    [revision]
  );

  return (
    <WorkspacePanelContext.Provider value={value}>
      {children}
      <WorkspacePanelSlideOver
        panel={value.activePanel}
        onClose={closeWorkspacePanel}
      />
    </WorkspacePanelContext.Provider>
  );
}

export function useWorkspacePanel(): WorkspacePanelContextValue {
  const context = useContext(WorkspacePanelContext);

  if (!context) {
    throw new Error(
      "useWorkspacePanel must be used within WorkspacePanelProvider"
    );
  }

  return context;
}

export {
  closeWorkspacePanel,
  openWorkspacePanel,
  replaceWorkspacePanel,
} from "@/features/workspace/panels/workspace-panel-stack";
