-- profiles (Module 1)
create table profiles (
  id uuid references auth.users primary key,
  phone_number text unique not null,
  name text,
  role text check (role in ('trader', 'service_provider', 'group_member')),
  business_type text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- transactions (Module 2)
-- CRITICAL: id is client-generated. Never generate server-side.
-- CRITICAL: insert-only. No update or delete policies.
-- CRITICAL: amount is numeric, never float.
create table transactions (
  id uuid primary key, -- client-generated via crypto.randomUUID()
  profile_id uuid references profiles(id) not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric not null,
  category text check (category in ('Sales', 'Supplies', 'Transport', 'Rent', 'Other')),
  note text,
  entry_date date not null,
  created_at timestamptz default now(),
  synced_at timestamptz
);

-- reviews (Module 3)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  reviewed_profile_id uuid references profiles(id) not null,
  reviewer_profile_id uuid references profiles(id),
  rating integer check (rating between 1 and 5) not null,
  comment text,
  verified_transaction boolean default false,
  created_at timestamptz default now()
);

-- listings (Module 3)
create table listings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) not null,
  slug text unique not null,
  display_name text not null,
  category text,
  location text,
  bio text,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- savings_groups (Module 4)
create table savings_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_profile_id uuid references profiles(id),
  contribution_amount numeric not null,
  cycle_frequency text check (cycle_frequency in ('weekly', 'monthly')),
  payout_order jsonb, -- ordered array of profile_ids
  created_at timestamptz default now()
);

-- group_members (Module 4)
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references savings_groups(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(group_id, profile_id)
);

-- contributions (Module 4)
-- Same offline-sync pattern as transactions — client-generated IDs
create table contributions (
  id uuid primary key, -- client-generated
  group_id uuid references savings_groups(id) not null,
  profile_id uuid references profiles(id) not null,
  amount numeric not null,
  cycle_number integer not null,
  created_at timestamptz default now(),
  synced_at timestamptz
);
