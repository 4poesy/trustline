import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Single named client instance as requested
export const supabase = createBrowserClient(url, key)

// Re-export createClient to maintain backwards compatibility with existing hooks
export function createClient() {
  return supabase
}
