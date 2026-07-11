import type {
  AnyWorkspacePanel,
  OpenWorkspacePanelInput,
  WorkspacePanel,
  WorkspacePanelKind,
} from "@/features/workspace/panels/workspace-panel-types";
import { WORKSPACE_PANEL_TITLES } from "@/features/workspace/panels/workspace-panel-types";

let panelStack: AnyWorkspacePanel[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function buildPanelId(kind: WorkspacePanelKind, explicitId?: string): string {
  return explicitId ?? `workspace-panel-${kind}-${Date.now()}`;
}

function buildPanelEntry<K extends WorkspacePanelKind>(
  input: OpenWorkspacePanelInput<K>
): WorkspacePanel<K> {
  return {
    id: buildPanelId(input.kind, input.id),
    kind: input.kind,
    title: input.title ?? WORKSPACE_PANEL_TITLES[input.kind],
    payload: input.payload,
    openedAt: Date.now(),
  };
}

export function subscribeWorkspacePanels(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWorkspacePanelStack(): readonly AnyWorkspacePanel[] {
  return panelStack;
}

export function getActiveWorkspacePanel(): AnyWorkspacePanel | null {
  return panelStack.at(-1) ?? null;
}

export function openWorkspacePanel<K extends WorkspacePanelKind>(
  input: OpenWorkspacePanelInput<K>
): WorkspacePanel<K> {
  const entry = buildPanelEntry(input);
  panelStack = [...panelStack, entry as AnyWorkspacePanel];
  notify();
  return entry;
}

export function closeWorkspacePanel(): void {
  if (panelStack.length === 0) return;
  panelStack = panelStack.slice(0, -1);
  notify();
}

export function replaceWorkspacePanel<K extends WorkspacePanelKind>(
  input: OpenWorkspacePanelInput<K>
): WorkspacePanel<K> {
  const entry = buildPanelEntry(input);

  if (panelStack.length === 0) {
    panelStack = [entry as AnyWorkspacePanel];
  } else {
    panelStack = [...panelStack.slice(0, -1), entry as AnyWorkspacePanel];
  }

  notify();
  return entry;
}

export function clearWorkspacePanels(): void {
  if (panelStack.length === 0) return;
  panelStack = [];
  notify();
}
