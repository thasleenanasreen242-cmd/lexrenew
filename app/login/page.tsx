'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nextPath, setNextPath] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') setMode('signup')
    const next = params.get('next')
    if (next?.startsWith('/')) setNextPath(next)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const supabase = createClient()
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } })
      if (result.error) throw result.error
      if (mode === 'signup' && !result.data.session) setMessage('Account created. Check your email to confirm your account, then return here to sign in.')
      else window.location.assign(nextPath)
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Authentication failed'
      setMessage(text === 'Supabase environment variables are not configured' ? 'Login is not configured on this deployment.' : text)
    } finally { setBusy(false) }
  }

  function switchMode() { setMode(current => current === 'signin' ? 'signup' : 'signin'); setMessage(''); setPassword('') }

  return <main className="min-h-screen bg-white text-slate-950">
    <header className="flex h-16 items-center justify-between border-b border-slate-100 px-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><img src="/lexrenew-logo.svg" alt="LexRenew" className="h-9 w-auto" /></Link>
      <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"><ArrowLeft size={16}/> Back to dashboard</Link>
    </header>
    <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-9 text-center"><img src="/lexrenew-logo.svg" alt="LexRenew" className="mx-auto mb-6 h-12 w-auto"/><h1 className="text-3xl font-semibold tracking-tight">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'signin' ? 'Sign in to continue to your LexRenew workspace.' : 'Create your workspace and start tracking renewals.'}</p></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Email address</span><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input required autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-violet-50"/></div></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Password</span><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signin' ? 'Enter your password' : 'At least 6 characters'} className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-violet-50"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        {message && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-700">{message}</div>}
        <button disabled={busy} className="mt-1 h-12 w-full rounded-xl bg-[#7C3AED] px-4 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signin' ? 'Continue' : 'Create account'}</button>
      </form>
      <div className="my-7 flex items-center gap-4"><div className="h-px flex-1 bg-slate-200"/><span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">or</span><div className="h-px flex-1 bg-slate-200"/></div>
      <button onClick={switchMode} className="h-12 w-full rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{mode === 'signin' ? 'Create a new LexRenew account' : 'Sign in to an existing account'}</button>
      <p className="mt-8 text-center text-xs leading-5 text-slate-400">By continuing, you agree to use LexRenew for authorized legal and compliance renewal tracking.</p>
    </section>
  </main>
}
