import type { FollowUp } from "@/features/followup/types/followup-types";

const STORAGE_KEY = "helpy-followup-v1";

const listeners = new Set<() => void>();

let followUps: FollowUp[] = [];
let sessionHydrated = false;

export type OpenFollowUpsSnapshot = {
  items: FollowUp[];
  hasOpenFollowUps: boolean;
};

export const EMPTY_FOLLOWUP: FollowUp | null = null;

const OPEN_FOLLOWUPS_SERVER_SNAPSHOT: OpenFollowUpsSnapshot = {
  items: [],
  hasOpenFollowUps: false,
};

let openFollowUpsSnapshot: OpenFollowUpsSnapshot = OPEN_FOLLOWUPS_SERVER_SNAPSHOT;

const vorgangFollowUpSnapshots = new Map<string, FollowUp | null>();

function followUpEquals(a: FollowUp, b: FollowUp): boolean {
  return (
    a.id === b.id &&
    a.vorgangId === b.vorgangId &&
    a.status === b.status &&
    a.daysWithoutAnswer === b.daysWithoutAnswer &&
    a.recommendation === b.recommendation &&
    a.lastOutgoingMail === b.lastOutgoingMail &&
    a.lastIncomingMail === b.lastIncomingMail &&
    a.notifiedAt3Days === b.notifiedAt3Days &&
    a.notifiedAt7Days === b.notifiedAt7Days &&
    a.preparedAction?.kind === b.preparedAction?.kind &&
    a.preparedAction?.label === b.preparedAction?.label &&
    a.preparedAction?.buttonLabel === b.preparedAction?.buttonLabel
  );
}

function syncVorgangFollowUpSnapshot(vorgangId: string): void {
  const match = followUps.find((item) => item.vorgangId === vorgangId) ?? null;
  const cached = vorgangFollowUpSnapshots.get(vorgangId);

  if (!match) {
    if (cached !== EMPTY_FOLLOWUP) {
      vorgangFollowUpSnapshots.set(vorgangId, EMPTY_FOLLOWUP);
    }
    return;
  }

  if (cached && followUpEquals(cached, match)) {
    return;
  }

  vorgangFollowUpSnapshots.set(vorgangId, { ...match });
}

function recomputeSnapshots(): void {
  const open = followUps
    .filter((item) => item.status !== "abgeschlossen")
    .sort(
      (a, b) =>
        new Date(a.lastOutgoingMail).getTime() -
        new Date(b.lastOutgoingMail).getTime()
    );

  for (const item of followUps) {
    syncVorgangFollowUpSnapshot(item.vorgangId);
  }

  const nextItems = open
    .slice(0, 5)
    .map((item) => vorgangFollowUpSnapshots.get(item.vorgangId))
    .filter((item): item is FollowUp => item != null);

  const nextHasOpen = open.length > 0;
  const current = openFollowUpsSnapshot;

  if (
    current.hasOpenFollowUps === nextHasOpen &&
    current.items.length === nextItems.length &&
    current.items.every((item, index) => item === nextItems[index])
  ) {
    return;
  }

  openFollowUpsSnapshot = {
    items: nextItems,
    hasOpenFollowUps: nextHasOpen,
  };
}

function notify(): void {
  recomputeSnapshots();
  listeners.forEach((listener) => listener());
}

function hydrateFromSession(): void {
  if (typeof window === "undefined" || sessionHydrated) return;
  sessionHydrated = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      followUps = JSON.parse(raw) as FollowUp[];
    }
  } catch {
    followUps = [];
  }

  recomputeSnapshots();
}

function persistToSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(followUps));
}

export function subscribeFollowUp(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function peekFollowUpByVorgangId(vorgangId: string): FollowUp | null {
  hydrateFromSession();
  return followUps.find((item) => item.vorgangId === vorgangId) ?? null;
}

export function getAllFollowUps(): FollowUp[] {
  hydrateFromSession();
  return followUps.map((item) => ({ ...item }));
}

export function getFollowUpByVorgangId(vorgangId: string): FollowUp | null {
  const match = peekFollowUpByVorgangId(vorgangId);
  return match ? { ...match } : null;
}

export function getFollowUpSnapshot(vorgangId: string): FollowUp | null {
  hydrateFromSession();
  return vorgangFollowUpSnapshots.get(vorgangId) ?? EMPTY_FOLLOWUP;
}

export function getFollowUpServerSnapshot(): FollowUp | null {
  return EMPTY_FOLLOWUP;
}

export function getOpenFollowUpsSnapshot(): OpenFollowUpsSnapshot {
  hydrateFromSession();
  return openFollowUpsSnapshot;
}

export function getOpenFollowUpsServerSnapshot(): OpenFollowUpsSnapshot {
  return OPEN_FOLLOWUPS_SERVER_SNAPSHOT;
}

export function upsertFollowUp(followUp: FollowUp): void {
  hydrateFromSession();

  const index = followUps.findIndex((item) => item.vorgangId === followUp.vorgangId);
  if (index >= 0) {
    if (followUpEquals(followUps[index], followUp)) {
      return;
    }
    followUps[index] = followUp;
  } else {
    followUps = [followUp, ...followUps];
  }

  persistToSession();
  notify();
}

export function clearFollowUpStore(): void {
  followUps = [];
  sessionHydrated = false;
  vorgangFollowUpSnapshots.clear();
  openFollowUpsSnapshot = OPEN_FOLLOWUPS_SERVER_SNAPSHOT;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}
