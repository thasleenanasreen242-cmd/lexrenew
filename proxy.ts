import { type NextRequest, NextResponse } from 'next/server'

// Supabase auth was removed in favor of the Neon architecture.
// This proxy currently passes requests through unchanged.
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
