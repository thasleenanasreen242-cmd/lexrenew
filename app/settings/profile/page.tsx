'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, Save, UserRound } from 'lucide-react'
import ProfilePhotoField from '@/components/ProfilePhotoField'

type Profile = { full_name: string; job_title: string; phone: string; department: string; bio: string; timezone: string }
const emptyProfile: Profile = { full_name: '', job_title: '', phone: '', department: '', bio: '', timezone: 'Asia/Kolkata' }

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [workspace, setWorkspace] = useState('LexRenew Workspace')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/profile').then(async r => r.ok ? r.json() : null).then(data => {
      if (data?.profile) setProfile({ ...emptyProfile, ...data.profile })
      if (data?.workspace) setWorkspace(data.workspace)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function update<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile(p => ({ ...p, [key]: value })) }

  async function saveChanges() {
    if (!profile.full_name.trim()) return setMessage('Please enter your full name.')
    setSaving(true); setMessage('')
    try {
      const response = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, workspace: workspace.trim() || 'LexRenew Workspace' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save changes.')
      setMessage('Profile and workspace saved successfully.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save changes.') }
    finally { setSaving(false) }
  }

  if (loading) return <main className="min-h-screen grid place-items-center bg-[#f7f8fa]"><div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/>Loading profile…</div></main>

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]"><div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
    <header className="mb-7 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm hover:bg-slate-50"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile & Settings</h1></div></div><button onClick={saveChanges} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-60"><Save size={16}/>{saving ? 'Saving…' : 'Save changes'}</button></header>
    {message && <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"><Check size={16}/>{message}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-50 p-2.5 text-[#7c3aed]"><UserRound size={20}/></div><div><h2 className="font-semibold">Personal profile</h2><p className="text-sm text-slate-500">Manage your LexRenew profile information.</p></div></div></div>
      <ProfilePhotoField name={profile.full_name} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Full name<input value={profile.full_name} onChange={e => update('full_name', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]" placeholder="Your full name"/></label>
        <label className="text-sm font-semibold text-slate-700">Job title<input value={profile.job_title} onChange={e => update('job_title', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]" placeholder="Legal Manager"/></label>
        <label className="text-sm font-semibold text-slate-700">Phone<input value={profile.phone} onChange={e => update('phone', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]" placeholder="Phone number"/></label>
        <label className="text-sm font-semibold text-slate-700">Department<input value={profile.department} onChange={e => update('department', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]" placeholder="Legal / Operations"/></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Workspace name<input value={workspace} onChange={e => setWorkspace(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]" placeholder="Your organization name"/></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Short bio<textarea value={profile.bio} onChange={e => update('bio', e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]" placeholder="Add a short professional description"/></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Timezone<select value={profile.timezone} onChange={e => update('timezone', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#7c3aed]"><option value="Asia/Kolkata">India — Asia/Kolkata</option><option value="Asia/Dubai">UAE — Asia/Dubai</option><option value="Europe/London">UK — Europe/London</option><option value="America/New_York">US Eastern — America/New_York</option></select></label>
      </div>
    </section>
  </div></main>
}
