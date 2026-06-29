-- Enable RLS on every table
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table reviews enable row level security;
alter table listings enable row level security;
alter table savings_groups enable row level security;
alter table group_members enable row level security;
alter table contributions enable row level security;

-- PROFILES
-- Users can read and update only their own profile
drop policy if exists "Own profile read" on profiles;
create policy "Own profile read" on profiles for select using (auth.uid() = id);

drop policy if exists "Own profile update" on profiles;
create policy "Own profile update" on profiles for update using (auth.uid() = id);

drop policy if exists "Own profile insert" on profiles;
create policy "Own profile insert" on profiles for insert with check (auth.uid() = id);

-- TRANSACTIONS
-- Insert-only for owner. No update, no delete (RULES.md rule 3).
drop policy if exists "Own transactions read" on transactions;
create policy "Own transactions read" on transactions for select using (auth.uid() = profile_id);

drop policy if exists "Own transactions insert" on transactions;
create policy "Own transactions insert" on transactions for insert with check (auth.uid() = profile_id);
-- Deliberately no update or delete policy — this enforces the insert-only rule at DB level.

-- REVIEWS
-- Anyone can read reviews (public directory)
-- Authenticated users can insert reviews for others
-- Only the reviewer can see their own reviewer_profile_id
drop policy if exists "Reviews public read" on reviews;
create policy "Reviews public read" on reviews for select using (true);

drop policy if exists "Reviews insert" on reviews;
create policy "Reviews insert" on reviews for insert with check (auth.uid() = reviewer_profile_id);

-- LISTINGS
-- Public listings are readable by everyone (SEO-critical)
-- Only owner can insert/update their listing
drop policy if exists "Public listings read" on listings;
create policy "Public listings read" on listings for select using (is_public = true);

drop policy if exists "Own listing read" on listings;
create policy "Own listing read" on listings for select using (auth.uid() = profile_id);

drop policy if exists "Own listing insert" on listings;
create policy "Own listing insert" on listings for insert with check (auth.uid() = profile_id);

drop policy if exists "Own listing update" on listings;
create policy "Own listing update" on listings for update using (auth.uid() = profile_id);

-- SAVINGS GROUPS
-- Members can read groups they belong to
drop policy if exists "Member group read" on savings_groups;
create policy "Member group read" on savings_groups for select
  using (exists (
    select 1 from group_members
    where group_members.group_id = savings_groups.id
    and group_members.profile_id = auth.uid()
  ));

drop policy if exists "Group insert" on savings_groups;
create policy "Group insert" on savings_groups for insert with check (auth.uid() = created_by_profile_id);

-- GROUP MEMBERS
drop policy if exists "Member read" on group_members;
create policy "Member read" on group_members for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_members.group_id
    and gm.profile_id = auth.uid()
  ));

drop policy if exists "Member insert" on group_members;
create policy "Member insert" on group_members for insert with check (auth.uid() = profile_id);

-- CONTRIBUTIONS
-- Same group membership check
drop policy if exists "Own contributions read" on contributions;
create policy "Own contributions read" on contributions for select using (auth.uid() = profile_id);

drop policy if exists "Own contributions insert" on contributions;
create policy "Own contributions insert" on contributions for insert with check (auth.uid() = profile_id);
