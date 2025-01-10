/**
 * OpenAI module for SuperDoc
 * Handles OpenAI API key configuration and validation
 */
import { createCompletion, createStreamingCompletion, OpenAiErrorTypes } from './openai-api';

const OPENAI_KEY_PATTERN = /^sk-/;

/**
 * Validates an OpenAI API key format
 * @param {string} key - The OpenAI API key to validate
 * @returns {boolean} - Whether the key format is valid
 */
export function validateOpenAiKey(key) {
  if (!key || typeof key !== 'string') return false;
  return OPENAI_KEY_PATTERN.test(key);
}

/**
 * Creates a secure key storage object
 * Uses closure to prevent direct access to the key
 */
export function createSecureKeyStorage() {
  let apiKey = null;

  return {
    /**
     * Sets the API key in memory
     * @param {string} key - The OpenAI API key
     * @returns {boolean} - Whether the key was successfully stored
     */
    setKey(key) {
      if (!validateOpenAiKey(key)) {
        console.error('Invalid OpenAI API key format');
        return false;
      }
      apiKey = key;
      return true;
    },

    /**
     * Checks if a key is stored
     * @returns {boolean} - Whether a key is stored
     */
    hasKey() {
      return !!apiKey;
    },

    /**
     * Gets the stored key for internal use
     * @returns {string|null} - The stored API key or null
     */
    getKey() {
      return apiKey;
    },

    /**
     * Clears the stored key
     */
    clearKey() {
      apiKey = null;
    },
  };
}

/**
 * Creates the AI module configuration
 * @param {Object} config - The AI module configuration
 * @returns {Object} - The initialized AI module
 */
export function createAiModule(config = {}) {
  const keyStorage = createSecureKeyStorage();

  if (config.openAiKey) {
    keyStorage.setKey(config.openAiKey);
  }

  /**
   * Generate text using OpenAI
   * @param {string} prompt - The prompt for text generation
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated text
   */
  async function generateText(prompt, options = {}) {
    if (!keyStorage.hasKey()) {
      throw new Error('OpenAI key not configured');
    }

    const params = {
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      ...options,
    };

    const response = await createCompletion(params, keyStorage.getKey());
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate text with streaming response
   * @param {string} prompt - The prompt for text generation
   * @param {Function} onChunk - Callback for each chunk of generated text
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async function generateTextStream(prompt, onChunk, options = {}) {
    if (!keyStorage.hasKey()) {
      throw new Error('OpenAI key not configured');
    }

    const params = {
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      ...options,
    };

    await createStreamingCompletion(params, keyStorage.getKey(), onChunk);
  }

  return {
    keyStorage,
    isOpenAiEnabled: () => keyStorage.hasKey(),
    generateText,
    generateTextStream,
    destroy: () => keyStorage.clearKey(),
  };
}
