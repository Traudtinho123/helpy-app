export type {
  AnyWorkspacePanel,
  OpenWorkspacePanelInput,
  WorkspacePanel,
  WorkspacePanelAngebotPayload,
  WorkspacePanelDokumentPayload,
  WorkspacePanelKind,
  WorkspacePanelKundePayload,
  WorkspacePanelObjektPayload,
  WorkspacePanelPayloadMap,
  WorkspacePanelTerminPayload,
} from "@/features/workspace/panels/workspace-panel-types";

export {
  WORKSPACE_PANEL_DESCRIPTIONS,
  WORKSPACE_PANEL_TITLES,
} from "@/features/workspace/panels/workspace-panel-types";

export {
  clearWorkspacePanels,
  closeWorkspacePanel,
  getActiveWorkspacePanel,
  getWorkspacePanelStack,
  openWorkspacePanel,
  replaceWorkspacePanel,
  subscribeWorkspacePanels,
} from "@/features/workspace/panels/workspace-panel-stack";

export { WorkspacePanelSlideOver } from "@/features/workspace/panels/workspace-panel";

export {
  useWorkspacePanel,
  WorkspacePanelProvider,
} from "@/features/workspace/panels/workspace-panel-provider";
