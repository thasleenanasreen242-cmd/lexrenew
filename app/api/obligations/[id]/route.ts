import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function statusFor(expiryDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${expiryDate}T00:00:00`)
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  return days <= 30 ? 'Urgent' : days <= 60 ? 'Upcoming' : 'Healthy'
}

async function getClientAndUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getClientAndUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const title = String(body.title ?? '').trim()
    const expiryDate = String(body.expiry_date ?? '')
    if (!title || !expiryDate) {
      return NextResponse.json({ error: 'Title and expiry date are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('obligations')
      .update({
        title,
        type: String(body.type ?? 'Contract'),
        counterparty: body.counterparty ? String(body.counterparty).trim() : null,
        reference_number: body.reference_number ? String(body.reference_number).trim() : null,
        start_date: body.start_date || null,
        expiry_date: expiryDate,
        renewal_period_months: body.renewal_period_months ? Number(body.renewal_period_months) : null,
        auto_renew: Boolean(body.auto_renew),
        owner_id: user.id,
        owner_name: body.owner_name ? String(body.owner_name).trim() : null,
        status: statusFor(expiryDate),
        notes: body.notes ? String(body.notes).trim() : null,
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/obligations/[id]', error)
    return NextResponse.json({ error: 'Unable to update obligation' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getClientAndUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { id } = await params
    const { data, error } = await supabase
      .from('obligations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .is('archived_at', null)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/obligations/[id]', error)
    return NextResponse.json({ error: 'Unable to archive obligation' }, { status: 500 })
  }
}
