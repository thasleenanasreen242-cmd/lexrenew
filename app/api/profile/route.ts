import { NextResponse } from 'next/server'
import { ensureWorkspace, getAuthenticatedClient } from '@/lib/workspace'

const profileFields = 'id, email, full_name, job_title, phone, department, bio, timezone, avatar_url'

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const workspace = await ensureWorkspace(supabase, user)
    const { data: profile, error } = await supabase
      .from('users')
      .select(profileFields)
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ profile, workspace: workspace.name })
  } catch (error) {
    console.error('GET /api/profile', error)
    return NextResponse.json({ error: 'Unable to load profile' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const workspace = await ensureWorkspace(supabase, user)
    const body = await request.json()
    const profile = body?.profile ?? {}
    const fullName = String(profile.full_name ?? '').trim()
    const workspaceName = String(body?.workspace ?? '').trim() || 'LexRenew Workspace'

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const { data: savedProfile, error: profileError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        job_title: profile.job_title ? String(profile.job_title).trim() : null,
        phone: profile.phone ? String(profile.phone).trim() : null,
        department: profile.department ? String(profile.department).trim() : null,
        bio: profile.bio ? String(profile.bio).trim() : null,
        timezone: String(profile.timezone || 'Asia/Kolkata'),
      })
      .eq('id', user.id)
      .select(profileFields)
      .single()

    if (profileError) throw profileError

    const { data: savedWorkspace, error: workspaceError } = await supabase
      .from('organizations')
      .update({ name: workspaceName })
      .eq('id', workspace.id)
      .select('id, name, slug')
      .single()

    if (workspaceError) throw workspaceError

    return NextResponse.json({ profile: savedProfile, workspace: savedWorkspace.name })
  } catch (error) {
    console.error('POST /api/profile', error)
    return NextResponse.json({ error: 'Unable to save profile' }, { status: 500 })
  }
}
