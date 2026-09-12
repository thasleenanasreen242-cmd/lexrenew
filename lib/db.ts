// LexRenew uses Supabase as its database. Keep this module as a compatibility shim
// for any legacy imports while the application is fully migrated away from Neon.
import { createClient } from '@/lib/supabase/server'

export async function getDb() {
  return createClient()
}
