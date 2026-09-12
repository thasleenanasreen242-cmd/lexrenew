import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function statusFor(expiryDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${expiryDate}T00:00:00`)
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  return days <= 30 ? 'Urgent' : days <= 60 ? 'Upcoming' : 'Healthy'
}

async function workspace() {
  const rows = await sql`SELECT id, name FROM organizations ORDER BY created_at ASC LIMIT 1`
  if (!rows[0]) {
    const created = await sql`
      INSERT INTO organizations (name, slug)
      VALUES ('LexRenew Workspace', 'lexrenew-workspace')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `
    return created[0]
  }
  return rows[0]
}

export async function GET() {
  try {
    const org = await workspace()
    const rows = await sql`
      SELECT id, title, type, counterparty, reference_number, start_date,
             expiry_date, renewal_period_months, auto_renew, owner_id,
             owner_name, status, notes, archived_at, created_at, updated_at
      FROM obligations
      WHERE organization_id = ${org.id} AND archived_at IS NULL
      ORDER BY expiry_date ASC
    `
    return NextResponse.json({ organization: org, obligations: rows })
  } catch (error) {
    console.error('GET /api/obligations', error)
    return NextResponse.json({ error: 'Unable to load obligations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const title = String(body.title ?? '').trim()
    const expiryDate = String(body.expiry_date ?? '')
    if (!title || !expiryDate) {
      return NextResponse.json({ error: 'Title and expiry date are required' }, { status: 400 })
    }

    const org = await workspace()
    const rows = await sql`
      INSERT INTO obligations (
        organization_id, title, type, counterparty, reference_number,
        start_date, expiry_date, renewal_period_months, auto_renew,
        owner_name, status, notes
      ) VALUES (
        ${org.id}, ${title}, ${String(body.type ?? 'Contract')},
        ${body.counterparty ? String(body.counterparty).trim() : null},
        ${body.reference_number ? String(body.reference_number).trim() : null},
        ${body.start_date || null}, ${expiryDate},
        ${body.renewal_period_months ? Number(body.renewal_period_months) : null},
        ${Boolean(body.auto_renew)},
        ${body.owner_name ? String(body.owner_name).trim() : null},
        ${statusFor(expiryDate)}, ${body.notes ? String(body.notes).trim() : null}
      )
      RETURNING *
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/obligations', error)
    return NextResponse.json({ error: 'Unable to create obligation' }, { status: 500 })
  }
}
