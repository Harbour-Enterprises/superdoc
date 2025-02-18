import { randomBytes } from 'crypto';
import crc32 from 'buffer-crc32';

/**
 * @typedef {Object} TelemetryConfig
 * @property {string} [licenseKey] - License key for telemetry service
 * @property {boolean} [enabled=true] - Whether telemetry is enabled
 * @property {string} [endpoint] - Service endpoint
 * @property {string} superdocId - SuperDoc instance ID
 * @property {string} superdocVersion - SuperDoc version
 */

class Telemetry {
  /** @type {boolean} */
  enabled;

  /** @type {string} */
  superdocId;

  /** @type {string} */
  superdocVersion;

  /** @type {string} */
  licenseKey;

  /** @type {string} */
  endpoint;

  /** @type {string} */
  sessionId;

  /** @type {Object} */
  statistics = {
    nodeTypes: {},
    markTypes: {},
    styleTypes: {},
    unknownElements: [],
    errorCount: 0,
  };

  /** @type {Object} */
  fileStructure = {
    totalFiles: 0,
    maxDepth: 0,
    totalNodes: 0,
    files: [],
  };

  /** @type {Array} */
  events = [];

  /** @type {number|undefined} */
  flushInterval;

  /** @type {number} */
  static BATCH_SIZE = 50;

  /** @type {number} */
  static FLUSH_INTERVAL = 10000; // 10 seconds

  /** @type {string} */
  static COMMUNITY_LICENSE_KEY = 'community-and-eval-agplv3';

  /** @type {string} */
  static DEFAULT_ENDPOINT = 'https://ingest.superdoc.dev/v1/collect';

  /**
   * Initialize telemetry service
   * @param {TelemetryConfig} config
   */
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.licenseKey = config.licenseKey ?? Telemetry.COMMUNITY_LICENSE_KEY;
    this.endpoint = config.endpoint ?? Telemetry.DEFAULT_ENDPOINT;
    this.superdocId = config.superdocId;
    this.superdocVersion = config.superdocVersion;
    this.sessionId = this.generateId();

    if (this.enabled) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Get browser environment information
   * @returns {Object} Browser information
   */
  getBrowserInfo() {
    
    return {
      userAgent: window.navigator.userAgent,
      currentUrl: window.location.href,
      hostname: window.location.hostname,
      referrerUrl: document.referrer,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
    };
  }

  /**
   * Track document parsing event
   * @param {File} fileSource - Document file
   * @param {string} documentId - Document identifier
   * @param {'mark'|'element'|'node'|'handler'} category - Event category
   * @param {string} name - Event name
   * @param {string} path - Document path
   * @param {Object} metadata - Additional metadata
   */
  async trackParsing(fileSource, documentId, category, name, path, metadata = {}) {
    
    if (!this.enabled) return;

    const docInfo = await this.processDocument(fileSource, {
      id: documentId,
      internalId: metadata.internalId,
    });

    const event = {
      id: this.generateId(),
      type: 'parsing',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      superdocId: this.superdocId,
      superdocVersion: this.superdocVersion,
      document: docInfo,
      browser: this.getBrowserInfo(),
      category,
      name,
      path,
      statistics: this.statistics,
      fileStructure: this.fileStructure,
      metadata,
    };

    this.queueEvent(event);
  }

  /**
   * Track document usage event
   * @param {File} fileSource - Document file
   * @param {string} documentId - Document identifier
   * @param {string} name - Event name
   * @param {Object} properties - Additional properties
   */
  async trackUsage(fileSource, documentId, name, properties = {}) {
    if (!this.enabled) return;

    const docInfo = await this.processDocument(fileSource, {
      id: documentId,
      internalId: properties.internalId,
    });

    const event = {
      id: this.generateId(),
      type: 'usage',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      superdocId: this.superdocId,
      superdocVersion: this.superdocVersion,
      document: docInfo,
      browser: this.getBrowserInfo(),
      name,
      properties,
    };

    this.queueEvent(event);
  }

  /**
   * Track parsing statistics
   * @param {string} category - Statistic category
   * @param {string|Object} data - Statistic data
   */
  trackStatistic(category, data) {
    
    if (category === 'node') {
      this.statistics.nodeTypes[data] = (this.statistics.nodeTypes[data] || 0) + 1;
      this.fileStructure.totalNodes++;
    } else if (category === 'mark') {
      this.statistics.markTypes[data] = (this.statistics.markTypes[data] || 0) + 1;
    } else if (category === 'style') {
      const { type, value } = data;
      if (!this.statistics.styleTypes[type]) {
        this.statistics.styleTypes[type] = {};
      }
      this.statistics.styleTypes[type][value] = (this.statistics.styleTypes[type][value] || 0) + 1;
    } else if (category === 'unknown') {
      this.statistics.unknownElements.push(data);
    } else if (category === 'error') {
      this.statistics.errorCount++;
    }
  }

  /**
   * Track file structure
   * @param {Object} structure - File structure information
   */
  trackFileStructure(structure) {
    
    this.fileStructure = {
      ...this.fileStructure,
      ...structure,
      files: [...this.fileStructure.files, ...structure.files],
    };
  }

  /**
   * Process document metadata
   * @param {File} file - Document file
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Document metadata
   */
  async processDocument(file, options = {}) {
    
    if (!file) {
      console.warn('Telemetry: missing file source');
      return {};
    }

    let hash = '';
    try {
      hash = await this.generateCrc32Hash(file);
    } catch (error) {
      console.error('Failed to generate file hash:', error);
    }

    return {
      id: options.id,
      name: file.name,
      size: file.size,
      crc32: hash,
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
      type: file.type || 'docx',
      internalId: options.internalId,
    };
  }

  /**
   * Generate CRC32 hash for a file
   * @param {File} file - File to hash
   * @returns {Promise<string>} CRC32 hash
   * @private
   */
  async generateCrc32Hash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hashBuffer = crc32(buffer);
    return hashBuffer.toString('hex');
  }

  /**
   * Queue event for sending
   * @param {Object} event - Event to queue
   * @private
   */
  queueEvent(event) {
    this.events.push(event);

    if (this.events.length >= Telemetry.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush queued events to server
   * @returns {Promise<void>}
   */
  async flush() {
    if (!this.enabled || !this.events.length) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': this.licenseKey,
        },
        body: JSON.stringify(eventsToSend),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to upload telemetry:', error);
      // Add events back to queue
      this.events = [...eventsToSend, ...this.events];
    }
  }

  /**
   * Start periodic flush interval
   * @private
   */
  startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, Telemetry.FLUSH_INTERVAL);
  }

  /**
   * Generate unique identifier
   * @returns {string} Unique ID
   * @private
   */
  generateId() {
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      nodeTypes: {},
      markTypes: {},
      styleTypes: {},
      unknownElements: [],
      errorCount: 0,
    };

    this.fileStructure = {
      totalFiles: 0,
      maxDepth: 0,
      totalNodes: 0,
      files: [],
    };
  }

  /**
   * Clean up telemetry service
   * @returns {Promise<void>}
   */
  async destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    return this.flush();
  }
}

export { Telemetry };
