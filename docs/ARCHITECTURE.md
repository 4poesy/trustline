# ARCHITECTURE.md — Trustline

## High-Level Shape

```
┌─────────────────────────────────────────────┐
│              PWA Frontend (Lovable)          │
│  Next.js — SSR for public pages,              │
│  client-rendered for authenticated app shell  │
│                                                │
│  IndexedDB (local-first storage,               │
│  Modules 2 & 4)                                │
└───────────────────┬────────────────────────────┘
                     │  Supabase JS client SDK
                     ▼
┌─────────────────────────────────────────────┐
│                  Supabase                     │
│  - Postgres (single source of truth)          │
│  - Auth (phone OTP, SMS via Termii)           │
│  - Realtime (live sync across devices)        │
│  - Edge Functions (credit score calc,         │
│    savings payout logic — added in Module 4)  │
│  - Storage (profile photos, if added later)   │
└───────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              Termii (SMS delivery)             │
│  Configured at the Supabase Auth provider      │
│  level — not called directly by frontend code  │
└─────────────────────────────────────────────┘
```

## Why This Shape

- **No custom backend server (for now).** Supabase replaces the need for a hand-rolled Express/Node API for CRUD + auth + realtime. This is intentional — fewer moving parts, faster to build, easier to reason about for an MVP.
- **Frontend deployed on Vercel** (via Lovable export or direct deploy) — gives CDN-level caching and near-infinite scale for static/SSR pages with effectively zero ops work.
- **Edge Functions, not a separate backend**, for any logic too sensitive or complex to run client-side (credit scoring, payout scheduling). These still live "in" Supabase, keeping the system to two deployable surfaces: frontend + Supabase project.

## Module Boundaries

Each module is a vertical slice: its own tables, its own route group, its own UI components. Cross-module reads are allowed (e.g. Module 4's credit score reads Module 2's `transactions` table) but cross-module writes to another module's tables are not — each module owns writes to its own tables only.

```
Module 1 (Auth/Profile)  →  owns: profiles
Module 2 (Cashflow)      →  owns: transactions          (reads: profiles)
Module 3 (Trust/Dir)     →  owns: reviews, listings      (reads: profiles, transactions)
Module 4 (Credit/Savings)→  owns: savings_groups, contributions  (reads: profiles, transactions)
```

## Scaling Path (only act on these when actually bottlenecked — not pre-optimization)

| Stage | What changes |
|---|---|
| 0 – Thousands of users | Current architecture as-is. No changes needed. |
| 1 – Hundreds of thousands | Add database indexes on hot query paths (phone_number, profile_id, location). Move heavy computed queries (credit score) to scheduled Edge Functions that pre-compute and cache, rather than computing on every read. |
| 2 – Millions | Read replicas for Postgres. CDN caching tuned harder on directory pages. Consider moving live transaction realtime feed to a dedicated pub/sub layer if Supabase Realtime becomes a bottleneck. |
| 3 – Tens of millions+ | Regional sharding (e.g. separate clusters per country/region) becomes worth considering. This is the point where "is this still Supabase" becomes a real architectural question — revisit then, not now. |

## Explicit Non-Goals (for now)

- Multi-region database replication
- Custom backend server / microservices
- Native mobile app (PWA is the strategy — revisit only if app-store distribution becomes a clear growth lever)

See also: AGENTS.md, RULES.md, DATA_MODEL.md, SEO.md
