import { NextResponse } from 'next/server'
import { ensureWorkspace, getAuthenticatedClient } from '@/lib/workspace'

function statusFor(expiryDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.ceil((new Date(`${expiryDate}T00:00:00`).getTime() - today.getTime()) / 86400000)
  return days <= 30 ? 'Urgent' : days <= 60 ? 'Upcoming' : 'Healthy'
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const org = await ensureWorkspace(supabase, user)
    const { data, error } = await supabase.from('obligations').select('id, title, type, counterparty, reference_number, start_date, expiry_date, renewal_period_months, auto_renew, owner_id, owner_name, status, notes, archived_at, created_at, updated_at').eq('organization_id', org.id).is('archived_at', null).order('expiry_date', { ascending: true })
    if (error) throw error
    return NextResponse.json({ organization: org, obligations: data ?? [] })
  } catch (error) {
    console.error('GET /api/obligations', error)
    return NextResponse.json({ error: 'Unable to load obligations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const body = await request.json()
    const title = String(body.title ?? '').trim(), expiryDate = String(body.expiry_date ?? '')
    if (!title || !expiryDate) return NextResponse.json({ error: 'Title and expiry date are required' }, { status: 400 })
    const org = await ensureWorkspace(supabase, user)
    const { data, error } = await supabase.from('obligations').insert({ organization_id: org.id, title, type: String(body.type ?? 'Contract'), counterparty: body.counterparty ? String(body.counterparty).trim() : null, reference_number: body.reference_number ? String(body.reference_number).trim() : null, start_date: body.start_date || null, expiry_date: expiryDate, renewal_period_months: body.renewal_period_months ? Number(body.renewal_period_months) : null, auto_renew: Boolean(body.auto_renew), owner_id: user.id, owner_name: body.owner_name ? String(body.owner_name).trim() : null, status: statusFor(expiryDate), notes: body.notes ? String(body.notes).trim() : null }).select('*').single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/obligations', error)
    return NextResponse.json({ error: 'Unable to create obligation' }, { status: 500 })
  }
}
