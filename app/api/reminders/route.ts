import { NextResponse } from 'next/server'
import { ensureWorkspace, getAuthenticatedClient } from '@/lib/workspace'

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const workspace = await ensureWorkspace(supabase, user)
    const { data, error } = await supabase
      .from('reminders')
      .select('id, obligation_id, channel, days_before, enabled, last_sent_at, obligations(title, expiry_date)')
      .eq('organization_id', workspace.id)
      .order('days_before', { ascending: true })

    if (error) throw error
    return NextResponse.json({ reminders: data ?? [] })
  } catch (error) {
    console.error('GET /api/reminders', error)
    return NextResponse.json({ error: 'Unable to load reminders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const workspace = await ensureWorkspace(supabase, user)
    const body = await request.json()
    const obligationId = String(body.obligation_id ?? '')
    const daysBefore = Number(body.days_before)

    if (!obligationId || !Number.isInteger(daysBefore) || daysBefore < 0) {
      return NextResponse.json({ error: 'Obligation and valid reminder period are required' }, { status: 400 })
    }

    const { data: obligation, error: obligationError } = await supabase
      .from('obligations')
      .select('id')
      .eq('id', obligationId)
      .eq('organization_id', workspace.id)
      .is('archived_at', null)
      .maybeSingle()

    if (obligationError) throw obligationError
    if (!obligation) return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('reminders')
      .upsert({
        organization_id: workspace.id,
        obligation_id: obligationId,
        recipient_user_id: user.id,
        channel: 'email',
        days_before: daysBefore,
        enabled: true,
      }, { onConflict: 'obligation_id,recipient_user_id,channel,days_before' })
      .select('id, obligation_id, channel, days_before, enabled, last_sent_at')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/reminders', error)
    return NextResponse.json({ error: 'Unable to create reminder' }, { status: 500 })
  }
}
