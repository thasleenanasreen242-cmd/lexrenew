import { NextResponse } from 'next/server'
import { ensureWorkspace, getAuthenticatedClient } from '@/lib/workspace'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const workspace = await ensureWorkspace(supabase, user)
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from('reminders')
      .update({ enabled: Boolean(body.enabled) })
      .eq('id', id)
      .eq('organization_id', workspace.id)
      .select('id, obligation_id, channel, days_before, enabled, last_sent_at')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/reminders/[id]', error)
    return NextResponse.json({ error: 'Unable to update reminder' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const workspace = await ensureWorkspace(supabase, user)
    const { id } = await params

    const { data, error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('organization_id', workspace.id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/reminders/[id]', error)
    return NextResponse.json({ error: 'Unable to delete reminder' }, { status: 500 })
  }
}
