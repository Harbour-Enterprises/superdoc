export class Telemetry {
  constructor(config = {}) {
    if (!config.dsn) {
      throw new Error('TelemetryService requires a DSN configuration');
    }

    const parsedDsn = this.parseDsn(config.dsn);
    this.projectId = parsedDsn.projectId;
    this.token = parsedDsn.token;
    this.endpoint = parsedDsn.endpoint;

    this.events = [];
    this.batchSize = config.batchSize || 50;
    this.flushInterval = config.flushInterval || 60000; // 1 minute
    this.lastFlush = Date.now();

    // Start periodic flush if batch size > 1
    if (this.batchSize > 1) {
      this.startPeriodicFlush();
    }
  }

  parseDsn(dsn) {
    try {
      // Expected format: https://{token}@{host}/{projectId}
      const url = new URL(dsn);
      const token = url.username;
      const projectId = url.pathname.split('/').filter(Boolean)[0];

      if (!token || !projectId) {
        throw new Error('Invalid DSN format');
      }

      return {
        token,
        projectId,
        endpoint: url
      };
    } catch (error) {
      throw new Error(`Invalid DSN: ${error.message}`);
    }
  }

  startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, Math.min(this.flushInterval, 60000)); // Check at most every minute
  }

  trackUnknownXml(xml, docId) {
    const event = {
      type: 'unmapped_element',
      timestamp: new Date().toISOString(),
      data: {
        xml,
        documentId: docId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        projectId: this.projectId
      }
    };

    this.events.push(event);
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }
  
  trackUnknownMarks(marks, docId) {
    const event = {
      type: 'unmknown_marks',
      timestamp: new Date().toISOString(),
      data: {
        marks,
        documentId: docId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        projectId: this.projectId
      }
    };

    this.events.push(event);
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.events.length === 0) return;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-ID': this.projectId,
          'X-Token': this.token
        },
        body: JSON.stringify(this.events)
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Clear events after successful upload
      this.events = [];
      this.lastFlush = Date.now();
      console.log('Telemetry events sent successfully');

    } catch (error) {
      console.error('Failed to upload telemetry:', error);

      // Implement a max queue size to prevent memory issues
      if (this.events.length > 1000) {
        console.warn('Telemetry queue too large, dropping oldest events');
        this.events = this.events.slice(-1000);
      }
    }
  }

  // Clean up when service is no longer needed
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    // Attempt one final flush
    if (this.events.length > 0) {
      this.flush();
    }
  }
}
