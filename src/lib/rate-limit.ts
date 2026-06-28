// Simple in-memory fixed-window rate limiter. Good enough for a single Node
// instance (the standalone adapter): it resets on restart and is NOT shared
// across instances, so if you ever scale horizontally, swap the Map for a shared
// store (Redis / KV) keyed the same way.
type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

export type RateResult = { allowed: boolean; retryAfter: number };

// Allows `limit` requests per `windowMs` per key. retryAfter is seconds until
// the window resets (0 when allowed).
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || now >= hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}
