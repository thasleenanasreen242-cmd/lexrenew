import 'server-only'

import { getToken } from '@vercel/connect'

/**
 * Returns the short-lived Vercel Connect token for the Supabase resource.
 * Keep this helper server-only; never expose the token to browser code.
 */
export async function getSupabaseConnectToken(subjectId?: string) {
  return getToken('supabase/lexrenew', {
    subject: subjectId
      ? { type: 'user', id: subjectId }
      : { type: 'user' },
  })
}
