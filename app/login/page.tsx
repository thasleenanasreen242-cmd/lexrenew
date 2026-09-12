'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { organization_name: organizationName || 'My Organization' },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        })
        if (error) throw error
        setMessage(data.session ? 'Account created. Redirecting…' : 'Account created. Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="text-2xl font-semibold tracking-tight text-slate-950">LexRenew</div>
          <p className="mt-2 text-sm text-slate-500">Legal & compliance renewal management</p>
        </div>
        <div className="mb-6 flex rounded-lg bg-slate-100 p-1 text-sm">
          <button onClick={() => setMode('login')} className={`flex-1 rounded-md px-3 py-2 ${mode === 'login' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-500'}`}>Log in</button>
          <button onClick={() => setMode('signup')} className={`flex-1 rounded-md px-3 py-2 ${mode === 'signup' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-500'}`}>Create account</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && <input value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="Organization name" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />}
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Work email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          <button disabled={loading} className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Please wait…' : mode === 'login' ? 'Log in to LexRenew' : 'Create LexRenew account'}</button>
        </form>
        {message && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>}
      </div>
    </main>
  )
}
