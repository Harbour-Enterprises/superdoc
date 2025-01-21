export class Telemetry {
  // Default community DSN that ships with the package
  static COMMUNITY_DSN = 'https://public_oss@telemetry.superdoc.dev/community';
  
  // Known event types for better tracking
  static EVENTS = {
    DOCUMENT: {
      RENDERED: 'document_rendered',
      LOADED: 'document_loaded',
      SAVED: 'document_saved',
      EXPORTED: 'document_exported'
    },
    EDITOR: {
      STARTED: 'editor_started',
      STOPPED: 'editor_stopped',
      MODE_CHANGED: 'editor_mode_changed'
    },
    COLLABORATION: {
      STARTED: 'collab_started',
      USER_JOINED: 'collab_user_joined',
      USER_LEFT: 'collab_user_left'
    }
  };

  static ERRORS = {
    DOCUMENT: {
      UNKNOWN_ELEMENT: 'unknown_element_error',
      UNKNOWN_MARKS: 'unknown_marks_error',
      PARSE_ERROR: 'parse_error',
      LOAD_ERROR: 'load_error',
      SAVE_ERROR: 'save_error'
    }
  };

  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debug = config.debug ?? false;
    
    // Handle DSN configuration
    const dsn = config.dsn ?? Telemetry.COMMUNITY_DSN;
    
    try {
      const parsedDsn = this.parseDsn(dsn);
      this.projectId = parsedDsn.projectId;
      this.token = parsedDsn.token;
      this.endpoint = config.endpoint ?? parsedDsn.endpoint;
      this.isCommunity = dsn === Telemetry.COMMUNITY_DSN;
    } catch (error) {
      console.warn('Invalid telemetry DSN, falling back to community:', error);
      const communityConfig = this.parseDsn(Telemetry.COMMUNITY_DSN);
      this.projectId = communityConfig.projectId;
      this.token = communityConfig.token;
      this.endpoint = communityConfig.endpoint;
      this.isCommunity = true;
    }

    // Additional configuration
    this.superdocId = config.superdocId;
    this.sessionId = this.generateSessionId();
    this.events = [];
    
    // Adjust settings based on user type
    if (this.isCommunity) {
      this.batchSize = 50;
      this.flushInterval = 60000; // 1 minute
      this.maxQueueSize = 500;
    } else {
      this.batchSize = config.batchSize || 50;
      this.flushInterval = config.flushInterval || 5000; // 5 seconds
      this.maxQueueSize = config.maxQueueSize || 1000;
    }

    if (this.enabled) {
      this.startPeriodicFlush();
    }

    // Show telemetry notice for community users
    if (this.isCommunity && this.enabled) {
      console.info(
        'SuperDoc collects anonymous usage data to help improve the library. ' +
        'To opt-out, set SUPERDOC_TELEMETRY_DISABLED=true in your environment. ' +
        'Learn more at https://superdoc.dev/telemetry'
      );
    }
  }

  /**
   * Track a standard event
   */
  trackEvent(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      type: 'event',
      name: eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      superdocId: this.superdocId,
      properties: this.isCommunity ? {
        // Limited properties for community users
        userAgent: navigator.userAgent,
        documentType: properties.documentType,
        eventName: eventName,
        // Hash any IDs for privacy
        documentId: properties.documentId ? this.hashId(properties.documentId) : undefined
      } : {
        userAgent: navigator.userAgent,
        ...properties
      }
    };

    this.queueEvent(event);
  }

  /**
   * Track an error event
   */
  trackError(error, context = {}) {
    if (!this.enabled) return;

    const errorEvent = {
      type: 'error',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      superdocId: this.superdocId,
      error: this.isCommunity ? {
        name: error.name,
        message: error.message,
        // Limited context for community
        documentType: context.documentType,
        operation: context.operation,
        documentId: context.documentId ? this.hashId(context.documentId) : undefined
      } : {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context
      }
    };

    this.queueEvent(errorEvent);
  }

  /**
   * Track unknown XML elements as parsing errors
   */
  trackUnknownXml(xml, docId, context = {}) {
    if (!this.enabled) return;

    const error = new Error('Unknown XML element encountered');
    error.name = Telemetry.ERRORS.DOCUMENT.UNKNOWN_ELEMENT;

    this.trackError(error, {
      xml: this.isCommunity ? this.sanitizeXml(xml) : xml,
      documentId: docId,
      operation: 'parse_document',
      ...context
    });
  }

  /**
   * Track unknown marks as parsing errors
   */
  trackUnknownMarks(marks, docId, context = {}) {
    if (!this.enabled) return;

    const error = new Error('Unknown mark type encountered');
    error.name = Telemetry.ERRORS.DOCUMENT.UNKNOWN_MARKS;

    this.trackError(error, {
      marks: this.isCommunity ? this.sanitizeMarks(marks) : marks,
      documentId: docId,
      operation: 'parse_document',
      ...context
    });
  }

  /**
   * Queue an event for sending
   */
  queueEvent(event) {
    if (this.debug) {
      console.debug('[SuperDoc Telemetry] Event queued:', event);
    }

    this.events.push(event);
    
    if (this.events.length > this.maxQueueSize) {
      this.events = this.events.slice(-this.maxQueueSize);
    }
    
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Parse DSN string into config
   * Format: https://{token}@{host}/{projectId}
   */
  parseDsn(dsn) {
    try {
      const url = new URL(dsn);
      const token = url.username;
      const projectId = url.pathname.split('/').filter(Boolean)[0];

      if (!token || !projectId) {
        throw new Error('Invalid DSN format');
      }

      return {
        token,
        projectId,
        endpoint: `${url.protocol}//${url.host}/v1/collect`
      };
    } catch (error) {
      throw new Error(`Invalid DSN: ${error.message}`);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start automatic flush interval
   */
  startPeriodicFlush() {
    this.flushIntervalId = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Sanitize XML content for community users by removing text content
   */
  sanitizeXml(xml) {
    if (typeof xml === 'string') {
      // Remove text content but keep structure
      return xml.replace(/>([^<]*)</g, '><')
               // Remove attributes that might contain sensitive data
               .replace(/\s+(?:data-|aria-|title|alt|name|id|class)="[^"]*"/g, '');
    }
    return xml;
  }

  /**
   * Sanitize marks for community users by removing potentially sensitive data
   */
  sanitizeMarks(marks) {
    if (!Array.isArray(marks)) return marks;
    
    return marks.map(mark => ({
      type: mark.type,
      // Only include safe attribute names
      attrs: Object.fromEntries(
        Object.entries(mark.attrs || {})
          .filter(([key]) => !['id', 'name', 'content', 'data'].includes(key))
      )
    }));
  }

  /**
   * Hash IDs for privacy in community telemetry
   */
  hashId(id) {
    if (!id) return id;
    
    // Create a simple hash of the ID
    // Note: In production, you might want to use a more robust hashing algorithm
    const hash = String(id).split('')
      .reduce((acc, char) => {
        const code = char.charCodeAt(0);
        return ((acc << 5) - acc) + code | 0;
      }, 0);
    
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Flush events in queue to endpoint
   */
  async flush() {
    if (!this.enabled || this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-ID': this.projectId,
          'X-Token': this.token
        },
        body: JSON.stringify(eventsToSend),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      if (this.debug) {
        console.debug('[SuperDoc Telemetry] Flushed events:', eventsToSend);
      }
    } catch (error) {
      console.error('Failed to upload telemetry:', error);
      // Add events back to queue on failure
      this.events = [...eventsToSend, ...this.events].slice(-this.maxQueueSize);
    }
  }

  /**
   * Clean up telemetry service
   */
  destroy() {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    
    // Attempt final flush of any remaining events
    if (this.events.length > 0) {
      this.flush();
    }
  }
}