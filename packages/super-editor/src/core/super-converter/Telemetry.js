/**
 * @typedef {Object} BaseEvent
 * @property {string} id - Unique event identifier
 * @property {string} timestamp - ISO timestamp of the event
 * @property {string} sessionId - Current session identifier
 */

/**
 * @typedef {Object} UsageEvent
 * @property {'usage'} type - Event type identifier
 * @property {string} name - Name of the usage event
 * @property {Object.<string, *>} properties - Event properties
 */

/**
 * @typedef {Object} ParsingEvent
 * @property {'parsing'} type - Event type identifier
 * @property {'mark'|'element'} category - Category of the parsed item
 * @property {string} name - Name of the parsed item
 * @property {string} path - Document path where item was found
 * @property {Object.<string, *>} [metadata] - Additional context
 */

/** @typedef {(UsageEvent & BaseEvent) | (ParsingEvent & BaseEvent)} TelemetryEvent */

/**
 * @typedef {Object} TelemetryConfig
 * @property {string} [dsn] - Data Source Name for telemetry service
 * @property {string} [endpoint] - Optional override for telemetry endpoint
 * @property {boolean} [enabled=true] - Whether telemetry is enabled
 */

class Telemetry {
  /** @type {boolean} */
  #enabled;
  
  /** @type {string} */
  #endpoint;
  
  /** @type {string} */
  #projectId;
  
  /** @type {string} */
  #token;
  
  /** @type {string} */
  #sessionId;
  
  /** @type {TelemetryEvent[]} */
  #events = [];
  
  /** @type {number|undefined} */
  #flushInterval;

  /** @type {number} */
  static BATCH_SIZE = 50;

  /** @type {number} */
  static FLUSH_INTERVAL = 30000; // 30 seconds

  /** @type {string} */
  static COMMUNITY_DSN = 'https://public@telemetry.superdoc.dev/community';

  /**
   * Initialize telemetry service
   * @param {TelemetryConfig} config
   */
  constructor(config = {}) {
    this.#enabled = config.enabled ?? true;
    
    try {
      const dsn = config.dsn ?? Telemetry.COMMUNITY_DSN;
      const { projectId, token, endpoint } = this.#parseDsn(dsn);
      this.#projectId = projectId;
      this.#token = token;
      this.#endpoint = config.endpoint ?? endpoint;
    } catch (error) {
      console.warn('Invalid telemetry configuration, disabling:', error);
      this.#enabled = false;
      return;
    }

    this.#sessionId = this.#generateId();
    
    if (this.#enabled) {
      this.#startPeriodicFlush();
    }
  }

  /**
   * Track feature usage
   * @param {string} name - Name of the feature/event
   * @param {Object.<string, *>} [properties] - Additional properties
   */
  trackUsage(name, properties = {}) {
    if (!this.#enabled) return;

    /** @type {UsageEvent & BaseEvent} */
    const event = {
      id: this.#generateId(),
      type: 'usage',
      timestamp: new Date().toISOString(),
      sessionId: this.#sessionId,
      name,
      properties
    };

    this.#queueEvent(event);
  }

  /**
   * Track parsing events
   * @param {'mark'|'element'} category - Category of parsed item
   * @param {string} name - Name of the item
   * @param {string} path - Document path where item was found
   * @param {Object.<string, *>} [metadata] - Additional context
   */
  trackParsing(category, name, path, metadata) {
    if (!this.#enabled) return;

    /** @type {ParsingEvent & BaseEvent} */
    const event = {
      id: this.#generateId(),
      type: 'parsing',
      timestamp: new Date().toISOString(),
      sessionId: this.#sessionId,
      category,
      name,
      path,
      ...(metadata && { metadata })
    };

    this.#queueEvent(event);
  }

  /**
   * Queue event for sending
   * @param {TelemetryEvent} event
   * @private
   */
  #queueEvent(event) {
    this.#events.push(event);
    
    if (this.#events.length >= Telemetry.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush queued events to server
   * @returns {Promise<void>}
   */
  async flush() {
    if (!this.#enabled || this.#events.length === 0) return;

    const eventsToSend = [...this.#events];
    this.#events = [];

    try {
      const response = await fetch(this.#endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-ID': this.#projectId,
          'X-Token': this.#token
        },
        body: JSON.stringify(eventsToSend)
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to upload telemetry:', error);
      // Add events back to queue
      this.#events = [...eventsToSend, ...this.#events];
    }
  }

  /**
   * Start periodic flush interval
   * @private
   */
  #startPeriodicFlush() {
    this.#flushInterval = setInterval(() => {
      if (this.#events.length > 0) {
        this.flush();
      }
    }, Telemetry.FLUSH_INTERVAL);
  }

  /**
   * Parse DSN string into config
   * @param {string} dsn
   * @returns {{ projectId: string, token: string, endpoint: string }}
   * @private
   */
  #parseDsn(dsn) {
    try {
      const url = new URL(dsn);
      return {
        token: url.username,
        projectId: url.pathname.split('/')[1],
        endpoint: `${url.protocol}//${url.host}/v1/collect`
      };
    } catch (error) {
      throw new Error(`Invalid DSN: ${error.message}`);
    }
  }

  /**
   * Generate unique identifier
   * @returns {string}
   * @private
   */
  #generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clean up telemetry service
   * @returns {Promise<void>}
   */
  destroy() {
    if (this.#flushInterval) {
      clearInterval(this.#flushInterval);
    }
    return this.flush();
  }
}

export { Telemetry };