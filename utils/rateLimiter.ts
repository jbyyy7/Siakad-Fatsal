/**
 * Simple in-memory rate limiter for API endpoints
 * Prevents abuse by limiting requests per IP address
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.requests.forEach((entry, key) => {
      if (now > entry.resetAt) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => this.requests.delete(key));
  }

  /**
   * Check if request should be allowed
   * @param identifier - Usually IP address or user ID
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limit exceeded
   */
  check(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetAt) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return null;
    }
    return entry.resetAt;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  RESET_PASSWORD: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  
  // User management - moderate
  CREATE_USER: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 users per hour
  DELETE_USER: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 deletions per hour
  
  // Email/notifications - moderate
  SEND_EMAIL: { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 emails per hour
  CHECK_EMAIL: { limit: 30, windowMs: 60 * 1000 }, // 30 checks per minute
  
  // Data operations - lenient
  IMPORT_STUDENTS: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 imports per hour
  EXPORT_DATA: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 exports per hour
  
  // Default for other endpoints
  DEFAULT: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
};

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  // In serverless environment, we might not have direct IP access
  return 'unknown-client';
}

/**
 * Middleware function to check rate limit
 * Returns Response if rate limit exceeded, null if allowed
 */
export function checkRateLimit(
  req: Request,
  config: { limit: number; windowMs: number }
): Response | null {
  const identifier = getClientIdentifier(req);
  const allowed = rateLimiter.check(identifier, config.limit, config.windowMs);
  
  if (!allowed) {
    const resetTime = rateLimiter.getResetTime(identifier);
    const resetDate = resetTime ? new Date(resetTime).toISOString() : 'unknown';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again later.`,
        resetAt: resetDate,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetTime || Date.now()) - Date.now()) / 1000),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate,
        },
      }
    );
  }
  
  return null;
}

export default rateLimiter;
