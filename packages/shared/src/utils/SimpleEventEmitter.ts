/**
 * A simple, browser-compatible EventEmitter implementation.
 * Replaces Node.js EventEmitter dependency to allow the shared package
 * to work in both Node.js and browser environments.
 */

type EventHandler = (...args: any[]) => void;

export class SimpleEventEmitter {
  private _listeners: Map<string, EventHandler[]> = new Map();

  on(event: string, listener: EventHandler): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(listener);
    return this;
  }

  once(event: string, listener: EventHandler): this {
    const wrapper: EventHandler = (...args: any[]) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event: string, listener: EventHandler): this {
    const listeners = this._listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  removeListener(event: string, listener: EventHandler): this {
    return this.off(event, listener);
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this._listeners.get(event);
    if (!listeners || listeners.length === 0) return false;
    // Copy to avoid mutation issues if a listener removes itself
    [...listeners].forEach(l => l(...args));
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event !== undefined) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
    return this;
  }

  listenerCount(event: string): number {
    return this._listeners.get(event)?.length ?? 0;
  }

  eventNames(): string[] {
    return Array.from(this._listeners.keys());
  }
}
