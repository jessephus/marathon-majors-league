/**
 * API Client Tests
 * 
 * Tests for the unified API client including:
 * - Retry logic with exponential backoff
 * - Error handling and classification
 * - Cache configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client - Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should retry transient network errors with exponential backoff', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    // Mock: First two calls fail with network error, third succeeds
    global.fetch
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ men: [], women: [] })
      });

    const startTime = Date.now();
    const resultPromise = apiClient.athletes.list();
    
    // Fast-forward through retry delays
    await vi.runAllTimersAsync();
    
    const result = await resultPromise;
    const elapsed = Date.now() - startTime;

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ men: [], women: [] });
    // Should have exponential delays: ~300ms + ~600ms
    expect(elapsed).toBeGreaterThan(0); // Timers were advanced
  });

  it('should retry 503 Service Unavailable errors', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service Unavailable' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ men: [], women: [] })
      });

    const resultPromise = apiClient.athletes.list();
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ men: [], women: [] });
  });

  it('should not retry 404 Not Found errors', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });

    await expect(apiClient.athletes.list()).rejects.toThrow('Not found');
    expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
  });

  it('should not retry 403 Forbidden errors', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' })
    });

    await expect(apiClient.results.update('default', {})).rejects.toThrow('Forbidden');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should respect maximum retry limit', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    // Always fail with retryable error
    global.fetch.mockRejectedValue(new Error('fetch failed'));

    const resultPromise = apiClient.athletes.list();
    await vi.runAllTimersAsync();

    await expect(resultPromise).rejects.toThrow('API request failed');
    expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should apply jitter to retry delays', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;
    
    global.setTimeout = vi.fn((fn, delay) => {
      delays.push(delay);
      return originalSetTimeout(fn, 0);
    });

    global.fetch
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    await apiClient.athletes.list();

    // First delay should be around 300ms ± jitter
    expect(delays[0]).toBeGreaterThan(225); // 300 - 25%
    expect(delays[0]).toBeLessThan(375);    // 300 + 25%
    
    // Second delay should be around 600ms ± jitter
    expect(delays[1]).toBeGreaterThan(450); // 600 - 25%
    expect(delays[1]).toBeLessThan(750);    // 600 + 25%
  });
});

describe('API Client - Cache Configuration', () => {
  it('should provide correct cache config for athletes', () => {
    const { cacheUtils } = require('../lib/api-client');
    const config = cacheUtils.getCacheConfig('athletes');
    
    expect(config.maxAge).toBe(3600);
    expect(config.sMaxAge).toBe(7200);
    expect(config.staleWhileRevalidate).toBe(86400);
  });

  it('should provide correct cache config for gameState', () => {
    const { cacheUtils } = require('../lib/api-client');
    const config = cacheUtils.getCacheConfig('gameState');
    
    expect(config.maxAge).toBe(30);
    expect(config.sMaxAge).toBe(60);
    expect(config.staleWhileRevalidate).toBe(300);
  });

  it('should provide correct cache config for results', () => {
    const { cacheUtils } = require('../lib/api-client');
    const config = cacheUtils.getCacheConfig('results');
    
    expect(config.maxAge).toBe(15);
    expect(config.sMaxAge).toBe(30);
    expect(config.staleWhileRevalidate).toBe(120);
  });

  it('should generate correct Cache-Control header', () => {
    const { cacheUtils } = require('../lib/api-client');
    const config = cacheUtils.getCacheConfig('athletes');
    const header = cacheUtils.getCacheControlHeader(config);
    
    expect(header).toBe('public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');
  });

  it('should set cache headers on response object', () => {
    const { cacheUtils } = require('../lib/api-client');
    const mockRes = {
      setHeader: vi.fn()
    };
    
    cacheUtils.setCacheHeaders(mockRes, 'athletes');
    
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age=3600'));
    expect(mockRes.setHeader).toHaveBeenCalledWith('CDN-Cache-Control', 'max-age=7200');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
  });
});

describe('API Client - Endpoint Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call athletes.list with correct endpoint', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ men: [], women: [] })
    });

    await apiClient.athletes.list({ confirmedOnly: true });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/athletes?confirmedOnly=true'),
      expect.any(Object)
    );
  });

  it('should call results.fetch with correct endpoint', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scored: [], unscored: [] })
    });

    await apiClient.results.fetch('NY2025', { skipDNS: true });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/results?gameId=NY2025&skipDNS=true'),
      expect.any(Object)
    );
  });

  it('should call gameState.load with correct endpoint', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ players: [], draftComplete: false })
    });

    await apiClient.gameState.load('Chicago2025');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/game-state?gameId=Chicago2025'),
      expect.any(Object)
    );
  });

  it('should call session.create with POST method', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Session created',
        session: {
          token: 'test-token',
          expiresAt: '2025-12-31',
          sessionType: 'player',
          displayName: 'Test Team',
          gameId: 'default'
        },
        uniqueUrl: 'http://example.com/team/test-token',
        instructions: 'Bookmark this URL'
      })
    });

    await apiClient.session.create('Test Team', 'Owner Name', 'default');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/session/create'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test Team')
      })
    );
  });
});

describe('API Client - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error with message from API response', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Invalid input' })
    });

    await expect(apiClient.athletes.list()).rejects.toThrow('Invalid input');
  });

  it('should throw error with statusText if no error message in response', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}) // No error field
    });

    await expect(apiClient.athletes.list()).rejects.toThrow('Internal Server Error');
  });

  it('should handle JSON parse errors gracefully', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON');
      }
    });

    await expect(apiClient.athletes.list()).rejects.toThrow('Internal Server Error');
  });

  it('should format network errors consistently', async () => {
    const { apiClient } = await import('../lib/api-client');
    
    // All retries fail
    global.fetch.mockRejectedValue(new Error('Network connection failed'));

    await expect(apiClient.athletes.list()).rejects.toThrow('API request failed: Network connection failed');
  });
});

export default {
  testEnvironment: 'node'
};
