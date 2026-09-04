interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const cache = new Map<string, RateLimitEntry>();

// Clean up stale entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.lastRefill > 600_000) {
        cache.delete(key);
      }
    }
  }, 600_000).unref?.();
}

/**
 * Token bucket rate limiter.
 * @param key Unique identifier (IP, user ID, or endpoint+user)
 * @param limit Maximum tokens allowed in bucket
 * @param windowMs Time window for full token refill in milliseconds
 */
export function rateLimit(key: string, limit: number = 30, windowMs: number = 60_000): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  let entry = cache.get(key);

  if (!entry) {
    entry = { tokens: limit - 1, lastRefill: now };
    cache.set(key, entry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refillRate = limit / windowMs;
  entry.tokens = Math.min(limit, entry.tokens + elapsed * refillRate);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    const timeToNextToken = Math.ceil((1 - entry.tokens) / refillRate);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil((now + timeToNextToken) / 1000),
    };
  }

  entry.tokens -= 1;
  return {
    success: true,
    limit,
    remaining: Math.floor(entry.tokens),
    reset: Math.ceil((now + windowMs) / 1000),
  };
}
