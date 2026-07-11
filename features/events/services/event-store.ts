import type { HelpyEvent, HelpyEventStatus } from "@/features/events/types/event-types";

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export class EventStore {
  private events: HelpyEvent[] = [];

  add(event: HelpyEvent): void {
    if (this.events.some((e) => e.id === event.id)) return;
    this.events.push({ ...event, status: event.status ?? "neu" });
    notify();
  }

  addMany(events: HelpyEvent[]): void {
    for (const event of events) {
      this.add(event);
    }
  }

  getAll(): HelpyEvent[] {
    return [...this.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getPending(): HelpyEvent[] {
    return this.getAll().filter((e) => e.status === "neu");
  }

  getById(id: string): HelpyEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  updateStatus(id: string, status: HelpyEventStatus): void {
    const event = this.events.find((e) => e.id === id);
    if (!event) return;
    event.status = status;
    notify();
  }

  clear(): void {
    this.events = [];
    notify();
  }

  get pendingCount(): number {
    return this.getPending().length;
  }

  get totalCount(): number {
    return this.events.length;
  }
}

let store: EventStore | null = null;

export function getEventStore(): EventStore {
  if (!store) store = new EventStore();
  return store;
}

export function subscribeEventStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetEventStore(): void {
  store?.clear();
  store = null;
}
