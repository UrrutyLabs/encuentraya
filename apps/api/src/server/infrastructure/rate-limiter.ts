/**
 * Rate limiter using @upstash/ratelimit
 * Provides persistent, distributed rate limiting via Upstash Redis
 * Falls back to in-memory limiter if Upstash credentials are not configured
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback rate limiter (for development/testing)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    ) as unknown as NodeJS.Timeout;
  }

  async limit(key: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // No entry or expired, create new entry
      this.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    // Entry exists and is valid
    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Create rate limiter instance
 * Uses Upstash Redis if credentials are available, otherwise falls back to in-memory
 */
function createRateLimiter(
  maxRequests: number,
  windowMs: number
): Ratelimit | InMemoryRateLimiter {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Use Upstash if credentials are available
  if (upstashUrl && upstashToken) {
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        maxRequests,
        `${Math.floor(windowMs / 1000)}s`
      ),
      analytics: true,
    });
  }

  // Fallback to in-memory limiter (for development/testing)
  console.warn(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not configured. Using in-memory rate limiter (not suitable for production with multiple instances)."
  );
  return new InMemoryRateLimiter(maxRequests, windowMs);
}

/**
 * Default rate limiter for contact form submissions
 * 5 requests per 15 minutes per IP/email
 */
export const contactRateLimiter = createRateLimiter(5, 15 * 60 * 1000);
