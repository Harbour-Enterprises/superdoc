/**
 * @typedef {Object} BaseEvent
 * @property {string} id - Unique event identifier
 * @property {string} timestamp - ISO timestamp of the event
 * @property {string} sessionId - Current session identifier
 * @property {Object} document - Document information
 * @property {string} [document.id] - Reference ID
 * @property {string} [document.type] - Document type
 * @property {string} [document.internalId] - Internal document ID
 * @property {string} [document.hash] - Document MD5 hash
 * @property {string} [document.lastModified] - Last modified timestamp
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
 * @property {string} [licenseKey] - License key for telemetry service
 * @property {string} [endpoint] - Optional override for telemetry endpoint
 * @property {boolean} [enabled=true] - Whether telemetry is enabled
 * @property {File} [fileSource] - current editor file
 * @property {string} documentId - Reference ID
 */

class Telemetry {
  /** @type {boolean} */
  #enabled;

  /** @type {string} */
  #endpoint;

  /** @type {string} */
  #licenseKey;
  
  /** @type {object} */
  #documentConfig;

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
  static COMMUNITY_LICENSE_KEY = 'community-and-eval-agplv3';

  /** @type {string} */
  static DEFAULT_ENDPOINT = 'https://telemetry.superdoc.dev/v1/collect';

  /**
   * Initialize telemetry service
   * @param {TelemetryConfig} config
   */
  constructor(config = {}) {
    this.#enabled = config.enabled ?? true;

    try {
      const licenseKey = config.licenseKey ?? Telemetry.COMMUNITY_LICENSE_KEY;
      this.initTelemetry(config, licenseKey);
    } catch (error) {
      console.warn('Failed to initialize telemetry:', error);
      return;
    }

    this.#sessionId = this.#generateId();

    if (this.#enabled) {
      this.#startPeriodicFlush();
    }
  }

  /**
   * Init variables
   * @param {TelemetryConfig} config
   * @param {string} licenseKey - License key for telemetry service
   */
  initTelemetry(config, licenseKey) {
    this.#licenseKey = licenseKey;
    this.#endpoint = config.endpoint ?? Telemetry.DEFAULT_ENDPOINT;
    this.#documentConfig = {
      documentId: config.documentId,
      internalId: config.internalId,
      fileSource: config.fileSource,
    }
  }

  /**
   * Create source payload for request
   */
  getSourceData() {
    return {
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      host: window.location.host,
      referrer: document.referrer,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
    };
  }

  /**
   * Track feature usage
   * @param {string} name - Name of the feature/event
   * @param {Object.<string, *>} [properties] - Additional properties
   */
  async trackUsage(name, properties = {}) {
    if (!this.#enabled) return;
    
    const document = await this.processDocument(this.#documentConfig.fileSource, {
      id: this.#documentConfig.documentId,
      internalId: properties.internalId,
    });

    /** @type {UsageEvent & BaseEvent} */
    const event = {
      id: this.#generateId(),
      type: 'usage',
      timestamp: new Date().toISOString(),
      sessionId: this.#sessionId,
      source: this.getSourceData(),
      document,
      name,
      properties,
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
  async trackParsing(category, name, path, metadata) {
    if (!this.#enabled) return;

    const document = await this.processDocument(this.#documentConfig.fileSource, {
      id: this.#documentConfig.documentId,
      internalId: metadata.internalId,
    });


    /** @type {ParsingEvent & BaseEvent} */
    const event = {
      id: this.#generateId(),
      type: 'parsing',
      timestamp: new Date().toISOString(),
      sessionId: this.#sessionId,
      source: this.getSourceData(),
      category,
      document,
      name,
      path,
      ...(metadata && { metadata }),
    };

    this.#queueEvent(event);
  }

  /**
   * Process document metadata
   * @param {File} file - Document file
   * @param {Object} options - Additional metadata options
   * @returns {Promise<Object>} Document metadata
   */
  async processDocument(file, options = {}) {
    let hash = '';
    try {
      hash = await this.#generateMD5Hash(file);
    } catch (error) {
      console.error('Failed to retrieve file hash:', error);
    }
    
    return {
      id: options.id,
      type: options.type || file.type,
      internalId: options.internalId,
      hash,
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    };
  }

  /**
   * Generate MD5 hash for a file
   * @param {File} file - File to hash
   * @returns {Promise<string>} MD5 hash
   * @private
   */
  async #generateMD5Hash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
    if (!this.#enabled || !this.#events.length) return;

    const eventsToSend = [...this.#events];
    this.#events = [];
    
    try {
      const response = await fetch(this.#endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': this.#licenseKey,
        },
        body: JSON.stringify(eventsToSend),
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
