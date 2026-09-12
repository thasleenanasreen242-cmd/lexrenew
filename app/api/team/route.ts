import { NextResponse } from 'next/server'
import { ensureWorkspace, getAuthenticatedClient } from '@/lib/workspace'

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const workspace = await ensureWorkspace(supabase, user)
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('user_id, role, created_at')
      .eq('organization_id', workspace.id)
      .order('created_at', { ascending: true })

    if (membershipError) throw membershipError

    const userIds = (memberships ?? []).map(member => member.user_id)
    const { data: users, error: usersError } = userIds.length
      ? await supabase.from('users').select('id, email, full_name').in('id', userIds)
      : { data: [], error: null }

    if (usersError) throw usersError

    const userMap = new Map((users ?? []).map(member => [member.id, member]))
    const members = (memberships ?? []).map(member => {
      const profile = userMap.get(member.user_id)
      return {
        id: member.user_id,
        name: profile?.full_name || profile?.email || 'Workspace member',
        email: profile?.email || '',
        role: member.role,
      }
    })

    return NextResponse.json({ workspace, members, currentUserId: user.id })
  } catch (error) {
    console.error('GET /api/team', error)
    return NextResponse.json({ error: 'Unable to load team' }, { status: 500 })
  }
}
