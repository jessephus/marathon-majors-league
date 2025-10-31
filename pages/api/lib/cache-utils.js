/**
 * Cache utilities for API endpoints
 */

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
 * 
 * @param {object} req - Request object
 * @param {string} etag - ETag to compare
 * @returns {boolean} True if client has current version
 */
export function checkETag(req, etag) {
  const clientETag = req.headers['if-none-match'];
  return clientETag === `"${etag}"`;
}

/**
 * Send 304 Not Modified response
 * 
 * @param {object} res - Response object
 */
export function send304(res) {
  res.status(304).end();
}
