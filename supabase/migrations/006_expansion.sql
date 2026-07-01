-- Migration: 006_expansion.sql
-- Add expansion modules for Trustline: KYC, P2P, Push tokens, exchange rates, QR payments, Agents, Insights cache, Invoices, developer platform, group commerce, insurance, and credit export.

-- 1. Alter existing tables to support multi-currency
alter table public.profiles add column if not exists country_code text default 'NG' not null;
alter table public.transactions add column if not exists currency text default 'NGN' not null;
alter table public.bill_payments add column if not exists currency text default 'NGN' not null;
alter table public.contributions add column if not exists currency text default 'NGN' not null;
alter table public.savings_groups add column if not exists currency text default 'NGN' not null;

-- 2. Create kyc_profiles table
create table if not exists public.kyc_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  tier integer default 0 not null check (tier in (0, 1, 2, 3)),
  bvn text, -- Encrypted at rest
  nin text, -- Encrypted at rest
  bvn_verified boolean default false not null,
  nin_verified boolean default false not null,
  document_type text check (document_type in ('national_id', 'voters_card', 'drivers_license', 'passport')),
  document_url text,
  document_verified boolean default false not null,
  selfie_url text,
  submitted_at timestamp with time zone,
  verified_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create p2p_transfers table
create table if not exists public.p2p_transfers (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid references public.profiles(id) on delete restrict not null,
  recipient_profile_id uuid references public.profiles(id) on delete restrict not null,
  amount numeric not null check (amount > 0),
  currency text default 'NGN' not null,
  note text,
  status text default 'pending' not null check (status in ('pending', 'completed', 'failed', 'reversed')),
  payment_provider_reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 4. Create device_tokens table
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create exchange_rates table
create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  rate numeric not null,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (from_currency, to_currency)
);

-- 6. Create qr_payments table
create table if not exists public.qr_payments (
  id uuid primary key default gen_random_uuid(),
  merchant_profile_id uuid references public.profiles(id) on delete restrict not null,
  payer_profile_id uuid references public.profiles(id) on delete restrict,
  amount numeric not null check (amount > 0),
  currency text default 'NGN' not null,
  payment_provider_reference text not null unique,
  status text default 'pending' not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 7. Create agents table
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  agent_code text not null unique,
  status text default 'active' not null check (status in ('active', 'suspended')),
  total_referrals integer default 0 not null,
  total_commission_earned numeric default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create agent_referrals table
create table if not exists public.agent_referrals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade not null,
  referred_profile_id uuid references public.profiles(id) on delete cascade not null unique,
  commission_amount numeric default 0.00 not null,
  commission_status text default 'pending' not null check (commission_status in ('pending', 'paid')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create insights_cache table
create table if not exists public.insights_cache (
  profile_id uuid references public.profiles(id) on delete cascade not null primary key,
  insights_json jsonb not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Create invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  invoice_number text not null,
  recipient_name text not null,
  recipient_phone text,
  line_items jsonb not null, -- Array of objects
  subtotal numeric not null,
  currency text default 'NGN' not null,
  notes text,
  status text default 'draft' not null check (status in ('draft', 'sent', 'paid')),
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  marked_paid_at timestamp with time zone,
  unique (profile_id, invoice_number)
);

-- 11. Create api_keys table
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  key_hash text not null unique,
  name text not null,
  scopes jsonb not null, -- Array of strings
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

-- 12. Create api_requests_log table
create table if not exists public.api_requests_log (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys(id) on delete cascade not null,
  endpoint text not null,
  response_code integer not null,
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Create group_purchases table
create table if not exists public.group_purchases (
  id uuid primary key default gen_random_uuid(),
  savings_group_id uuid references public.savings_groups(id) on delete cascade not null,
  title text not null,
  description text,
  target_amount numeric not null check (target_amount > 0),
  amount_contributed numeric default 0.00 not null,
  supplier_name text,
  supplier_profile_id uuid references public.profiles(id) on delete set null,
  status text default 'open' not null check (status in ('open', 'funded', 'completed', 'cancelled')),
  deadline date not null,
  created_by_profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Create group_purchase_contributions table
create table if not exists public.group_purchase_contributions (
  id uuid primary key default gen_random_uuid(),
  group_purchase_id uuid references public.group_purchases(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  synced_at timestamp with time zone,
  unique (group_purchase_id, profile_id)
);

-- 15. Create insurance_policies table
create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null,
  policy_reference text not null unique,
  product_type text not null check (product_type in ('stock_loss', 'device', 'health')),
  coverage_amount numeric not null check (coverage_amount > 0),
  premium_amount numeric not null check (premium_amount > 0),
  premium_frequency text not null check (premium_frequency in ('weekly', 'monthly')),
  status text default 'active' not null check (status in ('active', 'lapsed', 'claimed', 'cancelled')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. Create financial_summary_exports table
create table if not exists public.financial_summary_exports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  storage_url text not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- 17. Enable RLS on all tables
alter table public.kyc_profiles enable row level security;
alter table public.p2p_transfers enable row level security;
alter table public.device_tokens enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.qr_payments enable row level security;
alter table public.agents enable row level security;
alter table public.agent_referrals enable row level security;
alter table public.insights_cache enable row level security;
alter table public.invoices enable row level security;
alter table public.api_keys enable row level security;
alter table public.api_requests_log enable row level security;
alter table public.group_purchases enable row level security;
alter table public.group_purchase_contributions enable row level security;
alter table public.insurance_policies enable row level security;
alter table public.financial_summary_exports enable row level security;

-- 18. RLS Policies
create policy "Users can read own KYC profiles" on public.kyc_profiles for select using (auth.uid() = profile_id);
create policy "Users can insert own KYC profiles" on public.kyc_profiles for insert with check (auth.uid() = profile_id);
create policy "Users can update own KYC profiles" on public.kyc_profiles for update using (auth.uid() = profile_id);

create policy "Users can view P2P transfers they sent or received" on public.p2p_transfers
  for select using (auth.uid() = sender_profile_id or auth.uid() = recipient_profile_id);
create policy "Users can insert P2P transfers" on public.p2p_transfers
  for insert with check (auth.uid() = sender_profile_id);

create policy "Users can manage device tokens" on public.device_tokens
  for all using (auth.uid() = profile_id);

create policy "Anyone can read exchange rates" on public.exchange_rates
  for select using (true);

create policy "Users can view QR payments as merchant or payer" on public.qr_payments
  for select using (auth.uid() = merchant_profile_id or auth.uid() = payer_profile_id);
create policy "Users can insert QR payments" on public.qr_payments
  for insert with check (auth.uid() = merchant_profile_id or auth.uid() = payer_profile_id);

create policy "Anyone can read active agents list" on public.agents for select using (status = 'active');
create policy "Agents can view own profile" on public.agents for select using (auth.uid() = profile_id);
create policy "Users can apply to be agents" on public.agents for insert with check (auth.uid() = profile_id);

create policy "Agents can view referrals" on public.agent_referrals
  for select using (exists (select 1 from public.agents where agents.id = agent_referrals.agent_id and agents.profile_id = auth.uid()));

create policy "Users can read insights cache" on public.insights_cache for select using (auth.uid() = profile_id);

create policy "Users can manage own invoices" on public.invoices for all using (auth.uid() = profile_id);
create policy "Anyone can read invoices with send or paid status" on public.invoices for select using (status != 'draft');

create policy "Users can manage own API keys" on public.api_keys for all using (auth.uid() = profile_id);

create policy "Users can read own requests log" on public.api_requests_log for select
  using (exists (select 1 from public.api_keys where api_keys.id = api_requests_log.api_key_id and api_keys.profile_id = auth.uid()));

create policy "Anyone can read group purchases" on public.group_purchases for select using (true);
create policy "Group members can manage purchases" on public.group_purchases for all using (true);

create policy "Anyone can read group purchase contributions" on public.group_purchase_contributions for select using (true);
create policy "Users can manage own group purchase contributions" on public.group_purchase_contributions for all using (auth.uid() = profile_id);

create policy "Users can view own insurance policies" on public.insurance_policies for select using (auth.uid() = profile_id);
create policy "Users can insert own insurance policies" on public.insurance_policies for insert with check (auth.uid() = profile_id);

create policy "Users can view own financial summaries" on public.financial_summary_exports for select using (auth.uid() = profile_id);
create policy "Users can insert own financial summaries" on public.financial_summary_exports for insert with check (auth.uid() = profile_id);

-- 19. Indices for high read volumes
create index if not exists idx_kyc_profiles_profile_id on public.kyc_profiles(profile_id);
create index if not exists idx_p2p_transfers_sender on public.p2p_transfers(sender_profile_id);
create index if not exists idx_p2p_transfers_recipient on public.p2p_transfers(recipient_profile_id);
create index if not exists idx_device_tokens_profile_id on public.device_tokens(profile_id);
create index if not exists idx_qr_payments_merchant on public.qr_payments(merchant_profile_id);
create index if not exists idx_qr_payments_payer on public.qr_payments(payer_profile_id);
create index if not exists idx_invoices_profile_id on public.invoices(profile_id);
create index if not exists idx_api_keys_profile_id on public.api_keys(profile_id);
create index if not exists idx_group_purchases_group on public.group_purchases(savings_group_id);
create index if not exists idx_insurance_policies_profile on public.insurance_policies(profile_id);
