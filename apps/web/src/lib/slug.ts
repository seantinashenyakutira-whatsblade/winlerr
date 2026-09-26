/**
 * Slug derivation shared by the claim modal (live preview) and
 * `/api/claims`. Both sides MUST agree byte-for-byte, so the rule lives here
 * rather than being duplicated in the component and the route.
 *
 * Rules (from the task brief):
 *  - lowercase
 *  - alphanumeric + hyphens only
 *  - collapse repeated hyphens
 *  - trim leading/trailing hyphens
 *  - bounded to a DNS-safe length
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "www",
  "api",
  "app",
  "os",
  "docs",
  "mail",
  "support",
]);

/** Longest label we allow; 63 is the DNS label limit. */
export const SLUG_MAX_LENGTH = 63;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // Drop combining marks left behind by NFKD so "café" -> "cafe".
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Any run of non-alphanumerics (spaces, underscores, punctuation, existing
    // hyphens) collapses to a single hyphen.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
