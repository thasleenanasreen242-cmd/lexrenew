import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function statusFor(expiryDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${expiryDate}T00:00:00`)
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  return days <= 30 ? 'Urgent' : days <= 60 ? 'Upcoming' : 'Healthy'
}

async function workspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError

  if (membership?.organization_id) {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', membership.organization_id)
      .single()
    if (error) throw error
    return org
  }

  const { data: createdOrg, error: createOrgError } = await supabase
    .from('organizations')
    .insert({ name: 'LexRenew Workspace' })
    .select('id')
    .maybeSingle()

  if (createOrgError || !createdOrg) throw createOrgError ?? new Error('Unable to create workspace')

  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({ organization_id: createdOrg.id, user_id: userId, role: 'owner' })

  if (memberError) throw memberError

  return { id: createdOrg.id, name: 'LexRenew Workspace' }
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const org = await workspace(supabase, user.id)
    const { data, error } = await supabase
      .from('obligations')
      .select('id, title, type, counterparty, reference_number, start_date, expiry_date, renewal_period_months, auto_renew, owner_id, owner_name, status, notes, archived_at, created_at, updated_at')
      .eq('organization_id', org.id)
      .is('archived_at', null)
      .order('expiry_date', { ascending: true })

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
    const title = String(body.title ?? '').trim()
    const expiryDate = String(body.expiry_date ?? '')
    if (!title || !expiryDate) {
      return NextResponse.json({ error: 'Title and expiry date are required' }, { status: 400 })
    }

    const org = await workspace(supabase, user.id)
    const { data, error } = await supabase
      .from('obligations')
      .insert({
        organization_id: org.id,
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
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/obligations', error)
    return NextResponse.json({ error: 'Unable to create obligation' }, { status: 500 })
  }
}
