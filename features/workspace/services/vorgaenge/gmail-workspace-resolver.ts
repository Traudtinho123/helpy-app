import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { getVorgangDedupeKey } from "@/features/workspace/services/vorgaenge/vorgang-deduplication";

/** Stabile Workspace-ID — nie leer, mit Gmail-Fallbacks. */
export function resolveVorgangOpenId(vorgang: Vorgang): string {
  if (vorgang.id?.trim()) {
    return vorgang.id.trim();
  }

  if (vorgang.sourceEventId?.trim()) {
    const messageId = vorgang.sourceEventId.trim();
    return messageId.startsWith("brain-v3-")
      ? messageId
      : `brain-v3-${messageId}`;
  }

  if (vorgang.threadId?.trim()) {
    return `thread-${vorgang.threadId.trim()}`;
  }

  return "unbekannter-vorgang";
}

export function resolveVorgangOpenPath(
  vorgang: Vorgang,
  buildPath: (id: string) => string
): string {
  if (vorgang.href?.startsWith("/workspace/")) {
    return vorgang.href;
  }

  return buildPath(resolveVorgangOpenId(vorgang));
}

/** Ordnet Workspaces nach Deduplizierung den kanonischen Vorgangs-IDs zu. */
export function reindexWorkspacesForVorgaenge(
  mergedVorgaenge: Vorgang[],
  originalVorgaenge: Vorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): Record<string, WorkspaceVorgang> {
  const groups = new Map<string, Vorgang[]>();

  for (const vorgang of originalVorgaenge) {
    const key = getVorgangDedupeKey(vorgang);
    const group = groups.get(key) ?? [];
    group.push(vorgang);
    groups.set(key, group);
  }

  const next: Record<string, WorkspaceVorgang> = {};

  for (const merged of mergedVorgaenge) {
    const key = getVorgangDedupeKey(merged);
    const members = groups.get(key) ?? [merged];

    let workspace: WorkspaceVorgang | undefined =
      workspaces[merged.id] ??
      members.map((member) => workspaces[member.id]).find(Boolean);

    if (!workspace) {
      const byWorkspaceId = Object.values(workspaces).find(
        (item) => item.id === merged.id
      );
      workspace = byWorkspaceId;
    }

    if (workspace) {
      next[merged.id] = { ...workspace, id: merged.id };
    }
  }

  for (const [id, workspace] of Object.entries(workspaces)) {
    if (!next[id]) {
      next[id] = workspace;
    }
  }

  return next;
}

export function findWorkspaceForRequest(
  id: string,
  vorgaenge: Vorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): WorkspaceVorgang | null {
  const direct = workspaces[id];
  if (direct) {
    return { ...direct, id: direct.id || id };
  }

  const byWorkspaceObjectId = Object.values(workspaces).find((item) => item.id === id);
  if (byWorkspaceObjectId) {
    return { ...byWorkspaceObjectId, id: byWorkspaceObjectId.id || id };
  }

  const liste =
    vorgaenge.find((item) => item.id === id) ??
    vorgaenge.find((item) => item.href === `/workspace/${id}`) ??
    vorgaenge.find((item) => resolveVorgangOpenId(item) === id);

  if (liste) {
    const canonicalId = resolveVorgangOpenId(liste);
    const canonicalWorkspace =
      workspaces[canonicalId] ??
      workspaces[liste.id] ??
      Object.values(workspaces).find((item) => item.id === liste.id);

    if (canonicalWorkspace) {
      return { ...canonicalWorkspace, id: canonicalId };
    }
  }

  if (id.startsWith("brain-v3-")) {
    const messageId = id.slice("brain-v3-".length);
    const byMessage = vorgaenge.find(
      (item) =>
        item.sourceEventId === messageId ||
        item.id === id ||
        item.id === `brain-v3-${messageId}`
    );

    if (byMessage) {
      const match =
        workspaces[byMessage.id] ??
        Object.values(workspaces).find((item) => item.id === byMessage.id);
      if (match) {
        return { ...match, id: byMessage.id };
      }
    }
  }

  if (id.startsWith("thread-")) {
    const threadId = id.slice("thread-".length);
    const byThread = vorgaenge.find((item) => item.threadId === threadId);
    if (byThread && workspaces[byThread.id]) {
      return { ...workspaces[byThread.id], id: byThread.id };
    }
  }

  for (const vorgang of vorgaenge) {
    if (vorgang.threadId && workspaces[vorgang.id]) {
      const openId = resolveVorgangOpenId(vorgang);
      if (openId === id || vorgang.id === id) {
        return { ...workspaces[vorgang.id], id: vorgang.id };
      }
    }
  }

  return null;
}
