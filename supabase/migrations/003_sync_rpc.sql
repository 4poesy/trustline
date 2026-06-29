-- Create offline sync RPC handler function
create or replace function public.sync_offline_entries(
  p_transactions jsonb,
  p_contributions jsonb,
  p_user_id uuid
) returns jsonb as $$
declare
  v_tx_count integer := 0;
  v_con_count integer := 0;
  v_skipped integer := 0;
  v_errors text[] := array[]::text[];
  v_item jsonb;
begin
  -- Process Transactions
  for v_item in select * from jsonb_array_elements(p_transactions) loop
    -- Validate user ownership
    if (v_item->>'profile_id')::uuid <> p_user_id then
      v_errors := array_append(v_errors, 'Transaction profile_id mismatch: ' || (v_item->>'id'));
      continue;
    end if;
    
    -- Validate amount is positive
    if (v_item->>'amount')::numeric <= 0 then
      v_errors := array_append(v_errors, 'Transaction amount must be positive: ' || (v_item->>'id'));
      continue;
    end if;

    -- Insert or ignore (ON CONFLICT (id) DO NOTHING)
    insert into public.transactions (id, profile_id, type, amount, category, note, entry_date, created_at, synced_at)
    values (
      (v_item->>'id')::uuid,
      (v_item->>'profile_id')::uuid,
      (v_item->>'type'),
      (v_item->>'amount')::numeric,
      (v_item->>'category'),
      (v_item->>'note'),
      (v_item->>'entry_date')::date,
      coalesce((v_item->>'created_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do nothing;
    
    if found then
      v_tx_count := v_tx_count + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  -- Process Contributions
  for v_item in select * from jsonb_array_elements(p_contributions) loop
    -- Validate user ownership
    if (v_item->>'profile_id')::uuid <> p_user_id then
      v_errors := array_append(v_errors, 'Contribution profile_id mismatch: ' || (v_item->>'id'));
      continue;
    end if;
    
    -- Validate amount is positive
    if (v_item->>'amount')::numeric <= 0 then
      v_errors := array_append(v_errors, 'Contribution amount must be positive: ' || (v_item->>'id'));
      continue;
    end if;

    -- Insert or ignore (ON CONFLICT (id) DO NOTHING)
    insert into public.contributions (id, group_id, profile_id, amount, cycle_number, created_at, synced_at)
    values (
      (v_item->>'id')::uuid,
      (v_item->>'group_id')::uuid,
      (v_item->>'profile_id')::uuid,
      (v_item->>'amount')::numeric,
      (v_item->>'cycle_number')::integer,
      coalesce((v_item->>'created_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do nothing;

    if found then
      v_con_count := v_con_count + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'synced', v_tx_count + v_con_count,
    'skipped', v_skipped,
    'errors', to_jsonb(v_errors)
  );
end;
$$ language plpgsql security definer;
