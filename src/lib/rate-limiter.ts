interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
}

/**
 * Simple in-memory rate limiter using a sliding window approach.
 *
 * @param userId - The user's unique identifier
 * @param action - The action being rate-limited (e.g., 'improve-idea')
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowSeconds - Duration of the rate limit window in seconds
 */
export async function rateLimit(
    userId: string,
    action: string,
    maxRequests: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    // No existing entry or window has expired
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, {
            count: 1,
            resetAt: now + windowSeconds * 1000,
        });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    // Window still active, check if limit reached
    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    // Increment count
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
}

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof globalThis !== 'undefined') {
    const CLEANUP_INTERVAL = 5 * 60 * 1000;
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitMap.entries()) {
            if (now > entry.resetAt) {
                rateLimitMap.delete(key);
            }
        }
    }, CLEANUP_INTERVAL).unref?.();
}
