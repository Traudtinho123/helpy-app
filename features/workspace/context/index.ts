export type {
  WorkspaceAppointmentContext,
  WorkspaceContext,
  WorkspaceCustomerContext,
  WorkspaceMailContext,
  WorkspaceObjectContext,
  WorkspacePlatformObjectContext,
  WorkspaceRecommendationContext,
  WorkspaceWorkflowContext,
} from "@/features/workspace/context/workspace-context";

export {
  EMPTY_WORKSPACE_APPOINTMENT,
  EMPTY_WORKSPACE_CONTEXT,
  EMPTY_WORKSPACE_CONTEXT_DOCUMENTS,
  EMPTY_WORKSPACE_MAIL,
  EMPTY_WORKSPACE_PLATFORM_OBJECT,
  EMPTY_WORKSPACE_RECOGNIZED_DOCUMENTS,
  EMPTY_WORKSPACE_WORKFLOW,
} from "@/features/workspace/context/workspace-context";

export {
  buildWorkspaceContext,
  customerToVorgangKunde,
  findWorkspaceDocument,
  getServerWorkspaceContextSnapshot,
  getStableWorkspaceContext,
  peekWorkspaceContext,
  subscribeWorkspaceContext,
} from "@/features/workspace/context/workspace-context-service";

export {
  useOptionalWorkspaceContext,
  useWorkspaceContext,
  WorkspaceContextProvider,
} from "@/features/workspace/context/workspace-context-provider";
