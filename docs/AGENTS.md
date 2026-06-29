# AGENTS.md — Trustline

This file tells any AI coding agent (Lovable, Antigravity, Claude Code, etc.) how to work on this codebase. Read this before generating or modifying any code.

## What Trustline Is

Trustline is a mobile-first PWA serving informal economy workers — traders, vendors, service providers, and savings group members — most of whom have no formal bank record, credit history, or verifiable reputation, despite earning real, consistent income.

The app turns everyday activity (logging a sale, getting a review, joining a savings group) into:
- **Provable income history** (for future credit/loan access)
- **Provable reputation** (for new customers to trust them)
- **Structured savings** (rotating contribution groups, aka ajo/esusu)

Primary users are in Nigeria/West Africa first, but the architecture should not hardcode assumptions that block expansion to other regions later.

## Module Map

The product is split into 4 independently-scoped modules. Each module owns its own folder/route group and should not require changes to other modules' internals to function.

| Module | Purpose | Public or Private |
|---|---|---|
| 1. Auth & Profile | Phone OTP auth, user profile | Landing page public, rest private |
| 2. Cashflow Tracker | Offline-first income/expense logging | Private (behind login) |
| 3. Trust & Directory | Public profiles, reviews, searchable directory | Public (SEO-critical) |
| 4. Credit & Savings | Derived credit score, rotating savings groups | Private (behind login) |

## Core Architectural Rules (do not violate)

1. **Supabase is the backend.** This is an external Supabase project (not auto-provisioned by Lovable). Credentials are supplied manually. Do not create a new/separate Supabase project per module.
2. **No traditional server unless explicitly instructed.** Default to Supabase client SDK + Supabase Edge Functions for any server-side logic (e.g. credit score calc, payout scheduling). Do not stand up an Express/Node backend unless a prompt explicitly asks for one.
3. **Offline-first is non-negotiable for Modules 2 and 4.** Local writes (IndexedDB) happen before any network call. The UI must never block or show errors due to lack of connectivity.
4. **Transactions are insert-only.** No edit/delete on financial records. Corrections happen via new offsetting entries. This is a deliberate simplicity + data-integrity choice — do not "improve" this by adding edit/delete unless asked.
5. **Public pages must be crawlable.** Anything in Module 3 (and the Module 1 landing page) must be server-rendered or statically generated — never a client-only SPA route for indexable content.
6. **Phone number is the identity anchor, not email.** Most target users do not have or check email regularly.

## Conventions

- Mobile-first, large tap targets (min 48px), minimal typing wherever a tap/selection can substitute.
- Visual identity: warm-but-professional. Avoid generic "fintech blue." Lean toward earth tones or a confident green/teal.
- Keep copy plain and concrete — avoid jargon. Many users may have limited formal education; clarity beats cleverness.
- Every new table includes `created_at`. Tables holding user-generated content include `profile_id` as the foreign key back to `profiles.id`.

## When In Doubt

If a request from the user (Ark) conflicts with a rule in this file or in RULES.md, flag the conflict explicitly rather than silently picking one. Do not assume — ask, or proceed with the documented default and state the assumption.

See also: RULES.md, ARCHITECTURE.md, DATA_MODEL.md, SEO.md
