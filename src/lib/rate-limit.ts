// Simple in-memory fixed-window rate limiter. Good enough for a single Node
// instance (the standalone adapter): it resets on restart and is NOT shared
// across instances, so if you ever scale horizontally, swap the Map for a shared
// store (Redis / KV) keyed the same way.
type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

// Drop expired entries so the Map can't grow without bound: an attacker rotating
// source IPs would otherwise leave a permanent entry per IP until the process
// restarts. Swept at most once per minute (an expired entry lingers a little
// past its window, which is harmless — it's already treated as reset on read).
let lastSweep = 0;
const SWEEP_INTERVAL = 60_000;
function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [k, hit] of buckets) {
    if (now >= hit.resetAt) buckets.delete(k);
  }
}

export type RateResult = { allowed: boolean; retryAfter: number };

// Allows `limit` requests per `windowMs` per key. retryAfter is seconds until
// the window resets (0 when allowed).
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);
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
