'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Check, Loader2, LockKeyhole, LogOut, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  full_name: string | null
  avatar_path: string | null
  job_title: string | null
  phone: string | null
  department: string | null
  bio: string | null
  timezone: string | null
}
type Organization = { id: string; name: string }

export default function ProfileSettingsPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [bio, setBio] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [workspace, setWorkspace] = useState('')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const initials = useMemo(() => (name || email || 'U').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase(), [name, email])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError || !auth.user) {
        setMessage({ type: 'error', text: 'Your session could not be loaded. Please sign in again.' })
        setLoading(false)
        return
      }
      const user = auth.user
      setUserId(user.id)
      setEmail(user.email || '')

      const [{ data: profile }, { data: membership }] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_path, job_title, phone, department, bio, timezone').eq('user_id', user.id).maybeSingle(),
        supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).limit(1).maybeSingle(),
      ])

      if (!active) return
      const typedProfile = profile as Profile | null
      setName(typedProfile?.full_name || user.user_metadata?.full_name || '')
      setJobTitle(typedProfile?.job_title || '')
      setPhone(typedProfile?.phone || '')
      setDepartment(typedProfile?.department || '')
      setBio(typedProfile?.bio || '')
      setTimezone(typedProfile?.timezone || 'Asia/Kolkata')
      setAvatarPath(typedProfile?.avatar_path || null)

      if (membership?.organization_id) {
        const { data: org } = await supabase.from('organizations').select('id, name').eq('id', membership.organization_id).maybeSingle()
        if (org) {
          setOrganization(org)
          setWorkspace(org.name)
        }
      }

      if (typedProfile?.avatar_path) {
        const { data } = await supabase.storage.from('lexrenew-avatars').createSignedUrl(typedProfile.avatar_path, 3600)
        if (data?.signedUrl) setAvatarUrl(data.signedUrl)
      }
      setLoading(false)
    }
    load().catch(() => { if (active) { setMessage({ type: 'error', text: 'Could not load your profile.' }); setLoading(false) } })
    return () => { active = false }
  }, [])

  function flash(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    window.setTimeout(() => setMessage(null), 3500)
  }

  async function saveChanges() {
    if (!userId) return
    if (!name.trim()) return flash('error', 'Please enter your name.')
    if (!workspace.trim()) return flash('error', 'Please enter a workspace name.')
    setSaving(true)
    setMessage(null)
    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userId,
        full_name: name.trim(),
        avatar_path: avatarPath,
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
        department: department.trim() || null,
        bio: bio.trim() || null,
        timezone: timezone.trim() || null,
      }, { onConflict: 'user_id' })
      if (profileError) throw profileError

      if (organization) {
        const { error: orgError } = await supabase.from('organizations').update({ name: workspace.trim() }).eq('id', organization.id)
        if (orgError) throw orgError
      }

      const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: name.trim(), organization_name: workspace.trim() } })
      if (metadataError) throw metadataError
      setOrganization(organization ? { ...organization, name: workspace.trim() } : organization)
      flash('success', 'Profile and workspace changes saved.')
    } catch (error) {
      flash('error', error instanceof Error ? error.message : 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(file: File) {
    if (!userId) return
    if (!file.type.startsWith('image/')) return flash('error', 'Please choose an image file.')
    if (file.size > 2 * 1024 * 1024) return flash('error', 'Avatar must be 2 MB or smaller.')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/avatar-${Date.now()}.${extension}`
    const { error } = await supabase.storage.from('lexrenew-avatars').upload(path, file, { upsert: false, contentType: file.type })
    if (error) return flash('error', error.message)
    if (avatarPath) await supabase.storage.from('lexrenew-avatars').remove([avatarPath])
    setAvatarPath(path)
    const { data } = await supabase.storage.from('lexrenew-avatars').createSignedUrl(path, 3600)
    setAvatarUrl(data?.signedUrl || null)
    const { error: profileError } = await supabase.from('profiles').upsert({ user_id: userId, full_name: name.trim() || null, avatar_path: path }, { onConflict: 'user_id' })
    if (profileError) return flash('error', profileError.message)
    flash('success', 'Profile photo updated.')
  }

  async function sendPasswordReset() {
    if (!email) return
    setResetting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/settings/profile` })
    setResetting(false)
    if (error) return flash('error', error.message)
    flash('success', 'Password reset instructions sent to your email.')
  }

  async function signOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return <main className="min-h-screen grid place-items-center bg-[#f7f8fa]"><div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/>Loading profile…</div></main>

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#101828]">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" aria-label="Back to dashboard" className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm hover:bg-slate-50"><ArrowLeft size={18}/></Link>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile & Settings</h1></div>
          </div>
          <button onClick={saveChanges} disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-[#174ea6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"><Save size={16}/>{saving ? 'Saving…' : 'Save changes'}</button>
        </header>

        {message && <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.type === 'success' ? <Check size={16}/> : <ShieldCheck size={16}/>} {message.text}</div>}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-[#174ea6]"><UserRound size={20}/></div><div><h2 className="font-semibold">Personal profile</h2><p className="text-sm text-slate-500">Edit your profile information manually anytime.</p></div></div></div>
              <div className="p-5 sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 grid place-items-center text-xl font-semibold text-[#174ea6]">{avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover"/> : initials}</div>
                  <div><p className="font-semibold">Profile avatar</p><p className="mt-1 text-sm text-slate-500">PNG, JPG or WebP. Maximum 2 MB.</p><button type="button" onClick={() => fileRef.current?.click()} className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Camera size={15}/>Change photo</button><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) uploadAvatar(file); e.currentTarget.value = '' }}/></div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"/></label>
                  <label className="block text-sm font-semibold text-slate-700">Job title<input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Legal Manager" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"/></label>
                  <label className="block text-sm font-semibold text-slate-700">Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"/></label>
                  <label className="block text-sm font-semibold text-slate-700">Department<input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Legal / Operations" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"/></label>
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Email address<div className="relative mt-2"><Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400"/><input value={email} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-600"/></div><span className="mt-1.5 block text-xs font-normal text-slate-400">Email is managed securely by Supabase Auth.</span></label>
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Short bio<textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} maxLength={500} placeholder="Add a short professional description" className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"/></label>
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Timezone<select value={timezone} onChange={e => setTimezone(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"><option value="Asia/Kolkata">India — Asia/Kolkata</option><option value="Asia/Dubai">UAE — Asia/Dubai</option><option value="Europe/London">UK — Europe/London</option><option value="America/New_York">US Eastern — America/New_York</option><option value="America/Los_Angeles">US Pacific — America/Los_Angeles</option><option value="Asia/Singapore">Singapore — Asia/Singapore</option></select></label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><ShieldCheck size={20}/></div><div><h2 className="font-semibold">Workspace</h2><p className="text-sm text-slate-500">This name is shared across your LexRenew workspace.</p></div></div></div>
              <div className="p-5 sm:p-6"><label className="block text-sm font-semibold text-slate-700">Organization / Workspace name<input value={workspace} onChange={e => setWorkspace(e.target.value)} placeholder="Your organization name" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#174ea6] focus:ring-2 focus:ring-blue-50"/></label><div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">All editable profile and workspace fields are stored securely in Supabase. Click Save changes when you are finished.</div></div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><LockKeyhole size={19}/></div><div><h2 className="font-semibold">Security</h2><p className="text-sm text-slate-500">Protect your account.</p></div></div></div>
              <div className="p-5"><button onClick={sendPasswordReset} disabled={resetting} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">{resetting ? <Loader2 size={15} className="animate-spin"/> : <LockKeyhole size={15}/>} {resetting ? 'Sending…' : 'Reset password'}</button><button onClick={signOut} disabled={signingOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"><LogOut size={15}/>{signingOut ? 'Signing out…' : 'Sign out'}</button></div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#174ea6]">LexRenew</p><h3 className="mt-2 font-semibold">Your legal operations, organized.</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">Your profile can be edited manually whenever your role, department, contact details, or professional information changes.</p></div>
          </aside>
        </div>
      </div>
    </main>
  )
}
