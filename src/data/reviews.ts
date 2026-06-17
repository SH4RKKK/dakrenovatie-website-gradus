// Build-time loader for approved customer reviews stored in /resources/reviews.
// The raw JSON (including email + postcode) is read here at build time, but only
// `publicReviews` is exported for rendering, so private fields never reach the
// shipped HTML. Adding/approving a review = drop a JSON file in
// /resources/reviews/text and rebuild.

export type Review = {
  name?: string;
  email?: string;
  postcode?: string;
  review: string;
  anonymous?: boolean;
  date?: string;
  image?: string;
};

export type PublicReview = {
  quote: string;
  name: string;
  image?: string;
};

const reviewModules = import.meta.glob<Review>("/resources/reviews/text/*.json", {
  eager: true,
  import: "default",
});

// Non-JSON assets resolve to their final URL string via Vite's default import.
const imageModules = import.meta.glob<string>("/resources/reviews/image/*", {
  eager: true,
  import: "default",
});

// Map bare filename ("dak-jan.jpg") -> resolved asset URL.
const imageByName = new Map<string, string>();
for (const [path, url] of Object.entries(imageModules)) {
  const file = path.split("/").pop();
  if (file) imageByName.set(file, url);
}

// Newest first; reviews without a valid `review` text are skipped.
const reviews: Review[] = Object.values(reviewModules)
  .filter((r): r is Review => Boolean(r && r.review))
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

export const publicReviews: PublicReview[] = reviews.map((r) => ({
  quote: r.review,
  name: r.anonymous ? "Anonieme klant" : r.name?.trim() || "Tevreden klant",
  image: r.image ? imageByName.get(r.image) : undefined,
}));
