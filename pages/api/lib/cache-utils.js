/**
 * Cache utilities for API endpoints with performance instrumentation
 */

// Import performance monitor for cache tracking (only in browser context)
// In server context, we'll use a simple tracker
let performanceMonitor = null;
if (typeof window !== 'undefined') {
  import('../../lib/performance-monitor.js').then(module => {
    performanceMonitor = module.performanceMonitor;
  });
}

/**
 * Track cache access for performance monitoring
 * @param {string} type - Cache type ('results', 'gameState', 'athletes')
 * @param {boolean} hit - Whether it was a cache hit
 */
function trackCacheAccess(type, hit) {
  // Only track in browser (not in API route context)
  if (performanceMonitor && typeof performanceMonitor.trackCacheAccess === 'function') {
    performanceMonitor.trackCacheAccess(type, hit);
  }
}

/**
 * Generate ETag for response data
 * Uses simple hash function for consistent ETag generation
 * 
 * @param {any} data - Data to hash
 * @returns {string} ETag hash
 */
export function generateETag(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Set cache headers for API response
 * 
 * @param {object} res - Response object
 * @param {object} options - Cache options
 * @param {number} options.maxAge - Browser cache duration in seconds
 * @param {number} options.sMaxAge - CDN cache duration in seconds
 * @param {number} options.staleWhileRevalidate - Stale-while-revalidate duration in seconds
 */
export function setCacheHeaders(res, options = {}) {
  const {
    maxAge = 30,
    sMaxAge = 60,
    staleWhileRevalidate = 300,
  } = options;
  
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
}

/**
 * Check if client has current version via ETag
 * Returns true if client should use cached version (304)
 * Also sets X-Cache-Status header for client-side performance tracking
 * 
 * @param {object} req - Request object
 * @param {string} etag - ETag to compare
 * @param {string} cacheType - Cache type for tracking ('results', 'gameState', 'athletes')
 * @param {object} res - Response object (to set X-Cache-Status header)
 * @returns {boolean} True if client has current version
 */
function normalizeETag(value) {
  if (!value) {
    return null;
  }

  return value
    .replace(/^W\//, '') // strip weak validator prefix
    .replace(/"/g, '') // remove surrounding quotes
    .trim();
}

export function checkETag(req, etag, cacheType = 'unknown', res = null) {
  const rawClientETag = req.headers['if-none-match'];
  const clientETag = normalizeETag(rawClientETag);
  const serverETag = normalizeETag(etag);
  const isHit = Boolean(clientETag && serverETag && clientETag === serverETag);
  
  // Set X-Cache-Status header for client-side performance tracking
  if (res) {
    res.setHeader('X-Cache-Status', isHit ? 'HIT' : 'MISS');
    res.setHeader('X-Cache-Type', cacheType);
  }
  
  // Cache validation is silent - headers are available for client tracking
  
  return isHit;
}

/**
 * Send 304 Not Modified response
 * 
 * @param {object} res - Response object
 */
export function send304(res) {
  res.status(304).end();
}
