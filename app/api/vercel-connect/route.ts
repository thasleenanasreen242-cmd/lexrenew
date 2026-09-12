import { NextResponse } from 'next/server'
import { getSupabaseConnectToken } from '@/lib/vercel-connect'

/**
 * Server-side health check for the Vercel Connect → Supabase integration.
 * The token itself is intentionally never returned to the browser.
 */
export async function GET() {
  try {
    await getSupabaseConnectToken()
    return NextResponse.json({ connected: true })
  } catch (error) {
    console.error('Vercel Connect → Supabase check failed', error)
    return NextResponse.json(
      { connected: false, error: 'Vercel Connect token unavailable' },
      { status: 503 }
    )
  }
}
