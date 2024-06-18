export class EventEmitter {
  #callbacks = new Map();

  on(event, fn) {
    const callbacks = this.#callbacks.get(event);
    if (callbacks) callbacks.push(fn);
    else this.#callbacks.set(event, [fn]);
  }

  emit(event, ...args) {
    const callbacks = this.#callbacks.get(event);
    if (!callbacks) return;
    for (const fn of callbacks) {
      fn(...args);
      // fn.apply(this, args);
    }
  }

  off(event, fn) {
    const callbacks = this.#callbacks.get(event);
    if (!callbacks) return;
    if (fn) {
      this.#callbacks.set(event, callbacks.filter((cb) => cb !== fn));
    } else {
      this.#callbacks.delete(event);
    }
  }

  removeAllListeners() {
    this.#callbacks = new Map();
  }
}
