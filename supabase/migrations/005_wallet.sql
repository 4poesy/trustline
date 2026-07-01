-- Add wallet columns to profiles table
alter table public.profiles add column if not exists wallet_balance numeric default 0.00 not null;
alter table public.profiles add column if not exists currency text default 'NGN' not null;

-- Create wallet_transactions table
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('deposit', 'withdrawal', 'bill_payment', 'transfer')),
  amount numeric not null,
  currency text not null,
  description text,
  payment_method text not null check (payment_method in ('card', 'bank_transfer', 'wallet')),
  reference text unique not null,
  status text not null check (status in ('pending', 'successful', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.wallet_transactions enable row level security;

-- RLS policies
drop policy if exists "Users can view their own wallet transactions" on public.wallet_transactions;
create policy "Users can view their own wallet transactions" on public.wallet_transactions
  for select using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own wallet transactions" on public.wallet_transactions;
create policy "Users can insert their own wallet transactions" on public.wallet_transactions
  for insert with check (auth.uid() = profile_id);
