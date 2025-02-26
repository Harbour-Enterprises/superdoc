/**
 * Utility class to manage localStorage operations for SuperDoc
 */
export class LocalStorageManager {
  static PREFIX = 'superdoc::';

  /**
   * Get a value from localStorage with the superdoc prefix
   * @param {string} key - The key to get (without prefix)
   * @returns {any} The parsed value or null if not found
   */
  static get(key) {
    const fullKey = this.PREFIX + key;
    const value = localStorage.getItem(fullKey);
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Error parsing localStorage value:', e);
      return null;
    }
  }

  /**
   * Set a value in localStorage with the superdoc prefix
   * @param {string} key - The key to set (without prefix)
   * @param {any} value - The value to store (will be JSON stringified)
   */
  static set(key, value) {
    const fullKey = this.PREFIX + key;
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (e) {
      console.error('Error setting localStorage value:', e);
    }
  }

  /**
   * Merge an object into an existing object in localStorage with the superdoc prefix
   * Commonly used to merge settings in the settings object
   *
   * @param {string} key - The key to merge into (without prefix)
   * @param {Record<string, any>} value - The object to merge (will be JSON stringified)
   */
  static merge(key, value) {
    const fullKey = this.PREFIX + key;
    const existingObject = this.get(key);
    const mergedValue = { ...existingObject, ...value };
    try {
      localStorage.setItem(fullKey, JSON.stringify(mergedValue));
    } catch (e) {
      console.error('Error merging localStorage value:', e);
    }
  }

  /**
   * Remove a value from localStorage with the superdoc prefix
   * @param {string} key - The key to remove (without prefix)
   */
  static remove(key) {
    const fullKey = this.PREFIX + key;
    localStorage.removeItem(fullKey);
  }

  /**
   * Get all superdoc keys from localStorage
   * @returns {string[]} Array of keys without prefix
   */
  static getAllKeys() {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(this.PREFIX))
      .map((key) => key.replace(this.PREFIX, ''));
  }

  /**
   * Get a setting from the settings object
   * @param {string} key - The key to get (without prefix)
   * @returns {any} The parsed value or null if not found
   */
  static getSetting(key) {
    const value = this.get('settings') || {};
    return value[key];
  }
}
