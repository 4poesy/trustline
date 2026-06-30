-- Create bill_payments table
create table if not exists public.bill_payments (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('airtime', 'data', 'electricity', 'tv_subscription')),
  provider_reference text,
  recipient_number text not null,
  network_or_provider text not null,
  amount numeric not null,
  status text not null check (status in ('pending', 'successful', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS
alter table public.bill_payments enable row level security;

-- Policies
drop policy if exists "Users can view their own bill payments" on public.bill_payments;
create policy "Users can view their own bill payments" on public.bill_payments
  for select using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own bill payments" on public.bill_payments;
create policy "Users can insert their own bill payments" on public.bill_payments
  for insert with check (auth.uid() = profile_id);
