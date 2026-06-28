// Tiny helpers shared by the form API routes.

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

// JSON response with security headers and the right status. `extra` can add
// per-response headers (e.g. Retry-After on a 429).
export function json(body: unknown, status = 200, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, ...extra },
  });
}

// Coerce an unknown JSON value to a trimmed string (forms send strings; this
// guards against numbers/null/objects sneaking in).
export function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

// Reject cross-site browser POSTs. If an Origin header is present it must match
// the Host. Requests with no Origin (curl, server-to-server) are allowed through,
// browsers always attach Origin on cross-site requests, so this blocks the abuse
// case without breaking legitimate non-browser callers.
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

// Read the body with a hard byte cap, then JSON-parse. Throws "PAYLOAD_TOO_LARGE"
// when oversized and "BAD_JSON" when unparseable; callers map these to 413/400.
export async function readJson(
  request: Request,
  maxBytes = 16_384
): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("BAD_JSON");
  }
}

// True only if every value is within its max length (server-side guard against
// oversized individual fields).
export function withinLimits(
  values: Record<string, string>,
  limits: Record<string, number>
): boolean {
  return Object.entries(limits).every(([k, max]) => (values[k] ?? "").length <= max);
}
