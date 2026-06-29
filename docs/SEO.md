# SEO.md — Trustline

Applies only to public-facing pages: the landing page (Module 1) and the directory/profile pages (Module 3). Authenticated app screens (dashboard, cashflow, savings) are intentionally not optimized for search — they're private by design and should stay non-indexed.

## Non-Negotiables

1. **Rendering**: Public pages must be SSR or statically generated. A client-only SPA route is invisible to Google — this is the single most common SEO mistake to avoid here.
2. **Semantic HTML**: One `<h1>` per page, logical `<h2>`/`<h3>` hierarchy, no div-soup where a `<nav>`, `<main>`, `<article>`, `<section>` would be correct.
3. **Meta tags per page**: Unique `<title>` and meta description per page — never a site-wide default repeated across directory listings.
4. **Open Graph**: `og:title`, `og:description`, `og:image` on every public page, for clean previews when shared on WhatsApp/Facebook (high-relevance sharing channels for this audience).
5. **Structured data**: `LocalBusiness` JSON-LD on every directory listing page (Module 3) — name, address/region, category, rating aggregate if available. This is what unlocks Google's local pack / rich results for "near me" searches.
6. **Clean URLs**: `/directory/[region]/[category]/[slug]` — never query-string-based for anything indexable.
7. **Sitemap**: `sitemap.xml` auto-generated/updated whenever a new public listing is created or a listing's `is_public` flag changes. Submit to Google Search Console once live.
8. **robots.txt**: Allow crawling of `/` and `/directory/*`. Disallow `/dashboard`, `/cashflow`, `/login`, `/verify`, `/setup-profile`, and any other authenticated route.
9. **Core Web Vitals**: WebP images, lazy-loading below the fold, minimal layout shift. This audience is disproportionately on slow connections and low-end devices — fast pages are both an SEO requirement and a real usability requirement.

## Target Search Intent (for copywriting, not keyword-stuffing)

**Landing page (Module 1):**
- "build credit without a bank"
- "income tracker for traders"
- "savings group app Nigeria" / "ajo app"
- "track daily sales as a vendor"

**Directory pages (Module 3) — highest-value long-tail opportunity:**
- "[service] near me" (e.g. "tailor near me Lagos")
- "[service] in [neighborhood]" (e.g. "mechanic Ikeja")
- "[business name] reviews"

Write genuine, helpful copy around these themes. Do not keyword-stuff — Google's current ranking systems penalize this, and it reads poorly to real users anyway.

## Review Cadence

Once Module 3 ships, check Google Search Console monthly for: indexing errors, which directory pages are getting impressions, and any manual action flags. SEO here is a slow-compounding asset, not a one-time setup — revisit this file's targets quarterly as the directory grows.

See also: AGENTS.md, RULES.md, ARCHITECTURE.md, DATA_MODEL.md
