// Tiny helpers shared by the form API routes.

// JSON response with the right content-type and status.
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Coerce an unknown JSON value to a trimmed string (forms send strings; this
// guards against numbers/null/objects sneaking in).
export function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}
