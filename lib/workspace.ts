import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  if (!user.email) throw new Error('Authenticated user has no email address')
  const { error } = await supabase.from('users').upsert({
    id: user.id,
    email: user.email,
    full_name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null,
  }, { onConflict: 'id' })
  if (error) throw error
}

export async function ensureWorkspace(supabase: SupabaseClient, user: User) {
  await ensureUserProfile(supabase, user)
  const { data: membership, error: membershipError } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (membershipError) throw membershipError
  if (membership?.organization_id) {
    const { data: org, error } = await supabase.from('organizations').select('id, name, slug').eq('id', membership.organization_id).single()
    if (error) throw error
    return org
  }
  const slug = `lexrenew-${user.id}`
  const { data: org, error: orgError } = await supabase.from('organizations').upsert({ name: 'LexRenew Workspace', slug }, { onConflict: 'slug' }).select('id, name, slug').single()
  if (orgError || !org) throw orgError ?? new Error('Unable to create workspace')
  const { error: memberError } = await supabase.from('organization_members').upsert({ organization_id: org.id, user_id: user.id, role: 'Owner' }, { onConflict: 'organization_id,user_id' })
  if (memberError) throw memberError
  return org
}
