# DATA_MODEL.md — Trustline

Canonical schema reference. Any module touching the database should match this — if a module needs a field not listed here, update this file in the same change.

## profiles (Module 1)

| Column | Type | Notes |
|---|---|---|
| id | uuid | references auth.users, primary key |
| phone_number | text | unique, identity anchor |
| name | text | |
| role | text | enum: trader / service_provider / group_member |
| business_type | text | free text, e.g. "Tailoring" |
| location | text | free text for v1; consider normalized region table later |
| created_at | timestamp | |
| updated_at | timestamp | |

## transactions (Module 2)

| Column | Type | Notes |
|---|---|---|
| id | uuid | **client-generated**, never server-generated |
| profile_id | uuid | references profiles.id |
| type | text | enum: income / expense |
| amount | numeric | never float |
| category | text | Sales / Supplies / Transport / Rent / Other (v1 list, keep short) |
| note | text | optional |
| entry_date | date | the date the activity happened |
| created_at | timestamp | when the local record was created |
| synced_at | timestamp, nullable | null = not yet synced |

Rule: insert-only. No update/delete in v1.

## reviews (Module 3)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| reviewed_profile_id | uuid | the provider being reviewed |
| reviewer_profile_id | uuid, nullable | nullable to allow reviews from non-account customers later, if added |
| rating | integer | 1–5 |
| comment | text | optional |
| verified_transaction | boolean | true if linked to an actual logged transaction, for credibility weighting |
| created_at | timestamp | |

## listings (Module 3)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | uuid | references profiles.id |
| slug | text | unique, used in public URL — e.g. `johns-tailoring-ikeja` |
| display_name | text | public-facing business name (may differ from profile name) |
| category | text | matches business_type taxonomy |
| location | text | |
| bio | text | optional |
| is_public | boolean | default true; lets a user opt out of the directory |
| created_at | timestamp | |

## savings_groups (Module 4)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| created_by_profile_id | uuid | |
| contribution_amount | numeric | per-cycle contribution |
| cycle_frequency | text | weekly / monthly |
| payout_order | jsonb | ordered array of profile_ids |
| created_at | timestamp | |

## group_members (Module 4)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| group_id | uuid | references savings_groups.id |
| profile_id | uuid | references profiles.id |
| joined_at | timestamp | |

## contributions (Module 4)

| Column | Type | Notes |
|---|---|---|
| id | uuid | client-generated, same offline-sync pattern as transactions |
| group_id | uuid | |
| profile_id | uuid | who paid |
| amount | numeric | |
| cycle_number | integer | which round this payment is for |
| created_at | timestamp | |
| synced_at | timestamp, nullable | |

## Derived / Computed (not stored as columns)

- **Credit score**: computed from `transactions` (income consistency, volume over time) + `contributions` (savings discipline). Computed on read initially; move to a scheduled Edge Function that writes a cached `credit_scores` table once query load justifies it (see ARCHITECTURE.md scaling path).

See also: AGENTS.md, RULES.md, ARCHITECTURE.md, SEO.md
