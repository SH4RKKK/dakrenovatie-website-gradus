// Prefix an internal absolute path ("/contact") with Astro's configured base.
// import.meta.env.BASE_URL is "/" in the normal (SSR) build, so this is a no-op
// there; in the static GitHub Pages build it is "/<repo>/", which every internal
// link and public-folder asset needs. External targets (tel:, mailto:, http(s):,
// hash links) start with something other than "/" and are returned unchanged.
export function withBase(path: string): string {
  if (!path.startsWith("/")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + path;
}
