import type { AutopilotEvent } from "@/features/brain/services/autopilot/mock-events";

export type QueuedAutopilotEvent = AutopilotEvent & {
  queuedAt: string;
};

export class AutopilotEventQueue {
  private items: QueuedAutopilotEvent[] = [];

  enqueue(event: AutopilotEvent): QueuedAutopilotEvent {
    const queued: QueuedAutopilotEvent = {
      ...event,
      queuedAt: new Date().toISOString(),
    };
    this.items.push(queued);
    return queued;
  }

  dequeue(): QueuedAutopilotEvent | undefined {
    return this.items.shift();
  }

  peek(): QueuedAutopilotEvent | undefined {
    return this.items[0];
  }

  clear(): void {
    this.items = [];
  }

  size(): number {
    return this.items.length;
  }

  getAll(): QueuedAutopilotEvent[] {
    return [...this.items];
  }
}

export const globalAutopilotQueue = new AutopilotEventQueue();
