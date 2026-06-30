// Build-time loader for approved customer reviews stored in /resources/reviews.
// The raw JSON (including email + postcode) is read here at build time, but only
// `publicReviews` is exported for rendering, so private fields never reach the
// shipped HTML. Adding/approving a review = drop a JSON file in
// /resources/reviews/text and rebuild.
//
// Hardening: review files originate from unauthenticated form submissions that
// the owner hand-saves, so each file is treated as untrusted input. Files are
// read raw and JSON-parsed in a try/catch, then validated against the expected
// shape; anything malformed is skipped with a warning instead of breaking the
// build. Lengths are clamped to match the server-side LIMITS in
// src/pages/api/review.ts so an over-long hand-edited field can't bloat a page.

export type Review = {
  name?: string;
  email?: string;
  postcode?: string;
  review: string;
  anonymous?: boolean;
  date?: string;
};

export type PublicReview = {
  quote: string;
  name: string;
};

// Mirror of the server-side per-field caps (review.ts LIMITS).
const MAX_REVIEW = 1000;
const MAX_NAME = 120;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Raw file contents (strings), so a syntactically invalid JSON file can't throw
// at import time and break the build, we parse defensively below.
const rawModules = import.meta.glob("/resources/reviews/text/*.json", {
  eager: true,
  query: "?raw",
  import: "default",
});

function parseReview(path: string, raw: unknown): Review | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`[reviews] skipping ${path}: invalid JSON`);
    return null;
  }
  if (typeof data !== "object" || data === null) {
    console.warn(`[reviews] skipping ${path}: not an object`);
    return null;
  }
  const r = data as Record<string, unknown>;
  if (typeof r.review !== "string" || r.review.trim() === "") {
    console.warn(`[reviews] skipping ${path}: missing or empty "review"`);
    return null;
  }
  return {
    review: r.review.trim().slice(0, MAX_REVIEW),
    name: typeof r.name === "string" ? r.name.trim().slice(0, MAX_NAME) : undefined,
    anonymous: r.anonymous === true,
    date: typeof r.date === "string" && DATE_RE.test(r.date) ? r.date : undefined,
  };
}

// Newest first; entries that fail validation are skipped (see parseReview).
const reviews: Review[] = Object.entries(rawModules)
  .map(([path, raw]) => parseReview(path, raw))
  .filter((r): r is Review => r !== null)
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

export const publicReviews: PublicReview[] = reviews.map((r) => ({
  quote: r.review,
  name: r.anonymous ? "Anonieme klant" : r.name || "Tevreden klant",
}));
