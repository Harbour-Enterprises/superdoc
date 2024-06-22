/**
 * EventEmitter class is used to emit and subscribe to events.
 */
export class EventEmitter {
  #events = new Map();

  /**
   * Subscribe to the event.
   * @param name Event name.
   * @param fn Callback.
   */
  on(name, fn) {
    const callbacks = this.#events.get(name);
    if (callbacks) callbacks.push(fn);
    else this.#events.set(name, [fn]);
  }

  /**
   * Emit event.
   * @param name Event name.
   * @param args Arguments.
   */
  emit(name, ...args) {
    const callbacks = this.#events.get(name);
    if (!callbacks) return;
    for (const fn of callbacks) {
      fn.apply(this, args);
    }
  }

  /**
   * Remove a specific callback from event 
   * or all event subscriptions.
   * @param name Event name.
   * @param fn Callback.
   */
  off(name, fn) {
    const callbacks = this.#events.get(name);
    if (!callbacks) return;
    if (fn) {
      this.#events.set(name, callbacks.filter((cb) => cb !== fn));
    } else {
      this.#events.delete(name);
    }
  }

  /**
   * Remove all registered events and subscriptions.
   */
  removeAllListeners() {
    this.#events = new Map();
  }
}
