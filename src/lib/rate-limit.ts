// Token-bucket rate limiter (in-memory, per Node instance). Each key holds a
// token balance that refills continuously (one token per `refillMs`) up to
// `capacity`. A request consumes one token from EVERY limit it is checked
// against and is allowed only if all of them currently have a token, so a
// global ceiling and a per-IP limit compose without one being spent while
// another blocks. Resets on restart and is NOT shared across instances; if you
// scale out, move this to a shared store (Redis/KV) keyed the same way.
type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

// Bound memory: drop buckets idle long enough that a fresh one would be
// identical (fully refilled). Swept at most once a minute.
let lastSweep = 0;
const SWEEP_INTERVAL = 60_000;
const IDLE_TTL = 60 * 60_000; // 1 hour
function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now - b.last >= IDLE_TTL) buckets.delete(k);
  }
}

export type Limit = { key: string; capacity: number; refillMs: number };
export type RateResult = { allowed: boolean; retryAfter: number };

function refill(limit: Limit, now: number): Bucket {
  let b = buckets.get(limit.key);
  if (!b) {
    b = { tokens: limit.capacity, last: now };
    buckets.set(limit.key, b);
    return b;
  }
  const gained = (now - b.last) / limit.refillMs;
  if (gained > 0) {
    b.tokens = Math.min(limit.capacity, b.tokens + gained);
    b.last = now;
  }
  return b;
}

// Consume one token from every limit, but only if ALL have >=1 available.
// retryAfter is the longest wait (seconds) among the blocking limits.
export function rateLimit(limits: Limit[]): RateResult {
  const now = Date.now();
  sweep(now);
  const pairs = limits.map((l) => ({ l, b: refill(l, now) }));
  const blocked = pairs.filter((p) => p.b.tokens < 1);
  if (blocked.length > 0) {
    const retryAfter = Math.max(
      ...blocked.map((p) => Math.ceil(((1 - p.b.tokens) * p.l.refillMs) / 1000))
    );
    return { allowed: false, retryAfter };
  }
  for (const p of pairs) p.b.tokens -= 1;
  return { allowed: true, retryAfter: 0 };
}

// --- Mail-send policy ------------------------------------------------------
// Two layers guard the SMTP send:
//  1. A single GLOBAL bucket shared by every endpoint and every visitor. This
//     is the real flood/quota protection: it bounds total outbound mail no
//     matter how the per-IP key is spoofed (e.g. rotated X-Forwarded-For), so
//     the company mailbox and the provider's daily quota (Gmail ~500/day) can't
//     be exhausted. Tune below your provider's limit; defaults to ~12/hour
//     sustained (1 token / 5 min) with a burst of 20 → ≤ ~288/day.
//  2. A strict PER-IP bucket: 1 request per minute per IP per endpoint. NOTE
//     this trusts the platform-reported client IP; behind a proxy, configure it
//     to strip/overwrite inbound X-Forwarded-For (see SECURITY.md). The global
//     bucket is the spoof-proof backstop.
const GLOBAL_SEND: Limit = { key: "mail:global", capacity: 20, refillMs: 5 * 60_000 };
const PER_IP_REFILL_MS = 60_000; // 1 per minute per IP

export function mailRateLimit(scope: string, clientAddress: string): RateResult {
  return rateLimit([
    GLOBAL_SEND,
    { key: `${scope}:${clientAddress}`, capacity: 1, refillMs: PER_IP_REFILL_MS },
  ]);
}
