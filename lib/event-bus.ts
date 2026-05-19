type AppEvent =
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "project:created"
  | "project:updated"
  | "project:deleted"
  | "comment:created"
  | "attachment:created";

type Listener = () => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: AppEvent, fn: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
  }

  off(event: AppEvent, fn: Listener): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: AppEvent): void {
    this.listeners.get(event)?.forEach((fn) => fn());
  }
}

export const eventBus = new EventBus();
