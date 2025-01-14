import { describe, it, expect, vi } from 'vitest';
import { createStreamingCompletion, OpenAiErrorTypes } from '../../../core/modules/openai-api';

describe('OpenAI API', () => {
  it('should handle authentication errors', async () => {
    // Mock fetch to simulate authentication error
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid API key' }),
      }),
    );

    try {
      await createStreamingCompletion({}, 'invalid-key', () => {});
      // Invalid key should throw an error and we should not hit next line
      expect(true).toBe(false);
    } catch (error) {
      expect(error.type).toBe(OpenAiErrorTypes.AUTHENTICATION);
      expect(error.message).toBe('Invalid API key or unauthorized access');
    }
  });

  it('should handle rate limit errors', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      }),
    );

    try {
      await createStreamingCompletion({}, 'valid-key', () => {});
      // Rate limit should throw an error and we should not hit next line
      expect(true).toBe(false);
    } catch (error) {
      expect(error.type).toBe(OpenAiErrorTypes.RATE_LIMIT);
      expect(error.message).toBe('Rate limit exceeded. Please try again later');
    }
  });

  it('should fallback to a generic error if the error is not recognized', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      }),
    );

    try {
      await createStreamingCompletion({}, 'valid-key', () => {});
      expect(true).toBe(false);
    } catch (error) {
      expect(error.type).toBe(OpenAiErrorTypes.UNKNOWN);
      expect(error.message).toBe('An unknown error occurred');
    }
  });
});
