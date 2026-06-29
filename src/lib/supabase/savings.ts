import { supabase } from './client'
import { offlineDb } from '../offlineSync'

export interface SavingsGroup {
  id?: string
  name: string
  created_by_profile_id: string
  contribution_amount: number
  cycle_frequency: 'weekly' | 'monthly'
  payout_order?: string[]
  created_at?: string
  current_cycle?: number
}

export interface Contribution {
  id: string
  group_id: string
  profile_id: string
  amount: number
  cycle_number: number
  created_at?: string
  synced_at?: string | null
}

/**
 * Creates a new savings ajo group and adds the creator as the first member.
 */
export async function createGroup(data: Omit<SavingsGroup, 'id' | 'created_at'>) {
  const { data: group, error: gError } = await supabase
    .from('savings_groups')
    .insert({
      name: data.name,
      created_by_profile_id: data.created_by_profile_id,
      contribution_amount: data.contribution_amount,
      cycle_frequency: data.cycle_frequency,
      payout_order: data.payout_order || [data.created_by_profile_id],
    })
    .select()
    .single()

  if (gError || !group) {
    return { data: null, error: gError }
  }

  const { error: mError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      profile_id: data.created_by_profile_id,
    })

  return { data: group, error: mError }
}

/**
 * Lists all group memberships for a user.
 */
export async function getMyGroups(profileId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, savings_groups(*)')
    .eq('profile_id', profileId)

  const groups = data?.map((d) => d.savings_groups).filter(Boolean) || []
  return { data: groups, error }
}

/**
 * Returns full group cycle details, roster list, and payout turns.
 */
export async function getGroup(groupId: string) {
  const { data: group, error: gError } = await supabase
    .from('savings_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (gError || !group) {
    return { data: null, error: gError }
  }

  const { data: members, error: mError } = await supabase
    .from('group_members')
    .select('joined_at, profiles(*)')
    .eq('group_id', groupId)

  const { data: contributions, error: cError } = await supabase
    .from('contributions')
    .select('*')
    .eq('group_id', groupId)

  const currentCycle = Math.max(1, group.current_cycle || 1)
  const order = group.payout_order || []
  const nextPayoutIndex = (currentCycle - 1) % Math.max(1, order.length)
  const nextPayoutUserId = order[nextPayoutIndex] || null

  return {
    data: {
      ...group,
      members: members || [],
      contributions: contributions || [],
      current_cycle: currentCycle,
      who_is_next: nextPayoutUserId,
    },
    error: mError || cError,
  }
}

/**
 * Joins a savings ajo group using invite codes.
 */
export async function joinGroup(groupId: string, profileId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      profile_id: profileId,
    })
    .select()
    .single()
  return { data, error }
}

/**
 * Records esusu payout contribution locally first, then attempts server sync.
 */
export async function addContribution(data: Omit<Contribution, 'id' | 'created_at' | 'synced_at'>) {
  const contributionId = crypto.randomUUID()
  const con: Contribution = {
    ...data,
    id: contributionId,
    synced_at: null,
  }

  await offlineDb.contributions.put(con)

  try {
    const { error } = await supabase
      .from('contributions')
      .insert({
        id: con.id,
        group_id: con.group_id,
        profile_id: con.profile_id,
        amount: con.amount,
        cycle_number: con.cycle_number,
      })

    if (error) throw error

    const nowStr = new Date().toISOString()
    await offlineDb.contributions.update(con.id, { synced_at: nowStr })
    return { data: { ...con, synced_at: nowStr }, error: null }
  } catch (err) {
    console.warn('[SavingsAPI] Contribution offline cached, sync pending:', err)
    return { data: con, error: null }
  }
}

/**
 * Queries group contribution list and synchronizes local tables.
 */
export async function getContributions(groupId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*, profiles(name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (data) {
    for (const record of data) {
      await offlineDb.contributions.put({
        ...record,
        synced_at: new Date().toISOString(),
      })
    }
  }

  return { data, error }
}
