'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const supabase = createClient()
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } })

      if (result.error) throw result.error

      if (mode === 'signup' && !result.data.session) {
        setMessage('Account created. Check your email to confirm your account.')
      } else {
        window.location.assign('/')
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Authentication failed'
      setMessage(text === 'Supabase environment variables are not configured'
        ? 'Login is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.'
        : text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#174ea6] text-lg font-bold text-white">L</div><div><p className="text-xl font-bold tracking-tight">LexRenew</p><p className="text-sm text-slate-500">Legal & compliance renewals</p></div></div>
        <h1 className="text-2xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1 text-sm text-slate-500">{mode === 'signin' ? 'Sign in to your workspace.' : 'Start tracking your renewals.'}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Work email" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#174ea6]" />
          <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#174ea6]" />
          {message && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-[#174ea6] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }} className="mt-5 w-full text-sm font-semibold text-[#174ea6]">{mode === 'signin' ? 'Create a new account' : 'Already have an account? Sign in'}</button>
      </div>
    </main>
  )
}
