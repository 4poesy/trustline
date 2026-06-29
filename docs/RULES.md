# RULES.md — Trustline

Hard rules. These are not preferences — treat violations as bugs.

## Data Integrity

1. Never overwrite a synced server record with a local one during sync. Sync is insert-or-ignore (by client-generated UUID), never upsert-overwrite, for the `transactions` table.
2. Never generate transaction IDs server-side. IDs are created client-side (`crypto.randomUUID()`) at the moment of entry, so offline-created records have a stable identity before they ever reach the server.
3. Never delete a transaction record. Corrections are new entries.
4. Every financial amount is stored as `numeric`, never `float`/`double`, to avoid rounding errors.

## Auth & Identity

5. Phone number is unique per `profiles` row. Do not allow duplicate accounts per number.
6. Do not store OTP codes in plaintext logs. Supabase handles OTP internally — agents should not build a custom OTP store unless explicitly instructed otherwise.
7. JWT/session handling goes through Supabase Auth helpers — do not hand-roll session/cookie logic.

## Offline Behavior

8. Any screen used for daily data entry (Cashflow add screen, Savings contribution entry) must function fully with no network connection, with no error states shown to the user beyond a small, non-intrusive sync-status indicator.
9. Sync attempts are silent and automatic (on reconnect + periodic background check). Never require the user to manually trigger a sync to make the app usable, though a manual "pull to refresh" affordance is fine as a bonus.

## SEO / Public Pages

10. Any route intended to be indexed by Google must not rely solely on client-side rendering. Use SSR or static generation.
11. Every public page (landing page, directory profile pages) needs: unique `<title>`, unique meta description, Open Graph tags, semantic HTML (one `<h1>`, logical heading hierarchy).
12. Directory profile pages require `LocalBusiness` JSON-LD structured data once Module 3 is built.
13. No query-string-only routing for indexable pages (e.g. no `/profile?id=123` — use `/directory/[location]/[category]/[slug]`).

## Scope Discipline

14. Do not add features not in the current module's prompt "while you're at it." Flag good ideas for the user to decide on, don't silently expand scope.
15. Do not introduce a new database or auth provider without being asked. One Supabase project, one source of truth.
16. Keep each module's code physically separated (folder/route group) so a module could theoretically be extracted into its own deployable unit later without a rewrite.

## Visual / UX

17. Minimum tap target size: 48x48px.
18. Primary actions (e.g. "Add transaction," "Save") must be reachable with one thumb on a standard phone screen — no top-of-screen-only primary CTAs on mobile.
19. Never make the user wait on a spinner for an action that should be instant from their perspective (e.g. saving a transaction) — save locally first, sync in the background.

See also: AGENTS.md, ARCHITECTURE.md, DATA_MODEL.md, SEO.md
