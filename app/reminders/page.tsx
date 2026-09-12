'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bell, Clock3, Loader2, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { getJson, invalidateJson } from '@/lib/client-cache'

type Obligation = { id: string; title: string; expiry_date: string }
type Reminder = { id: string; obligation_id: string; channel: string; days_before: number; enabled: boolean; obligations: { title: string; expiry_date: string } | null }
type ReminderResponse = { reminders?: Reminder[] }
type ObligationResponse = { obligations?: Obligation[] }

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  async function load(force = false) {
    setLoading(true); setMessage('')
    try {
      if (force) invalidateJson('/api/reminders')
      const [reminderData, obligationData] = await Promise.all([
        getJson<ReminderResponse>('/api/reminders'),
        getJson<ObligationResponse | Obligation[]>('/api/obligations'),
      ])
      setReminders(reminderData.reminders ?? [])
      setObligations(Array.isArray(obligationData) ? obligationData : obligationData.obligations ?? [])
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load reminders') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const enabled = useMemo(() => reminders.filter(r => r.enabled).length, [reminders])
  const filtered = useMemo(() => reminders.filter(r => (r.obligations?.title ?? '').toLowerCase().includes(search.toLowerCase())), [reminders, search])

  async function addReminder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMessage('')
    const form = new FormData(e.currentTarget)
    try {
      const response = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ obligation_id: form.get('obligation_id'), days_before: Number(form.get('days_before')) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create reminder')
      setShowForm(false); await load(true)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create reminder') }
    finally { setSaving(false) }
  }

  async function toggle(reminder: Reminder) {
    const next = !reminder.enabled
    setReminders(current => current.map(item => item.id === reminder.id ? { ...item, enabled: next } : item))
    const response = await fetch(`/api/reminders/${reminder.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next }) })
    if (!response.ok) { setReminders(current => current.map(item => item.id === reminder.id ? { ...item, enabled: reminder.enabled } : item)); setMessage('Unable to update reminder') }
    else invalidateJson('/api/reminders')
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this reminder rule?')) return
    const response = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    if (!response.ok) return setMessage('Unable to delete reminder')
    setReminders(current => current.filter(item => item.id !== id)); invalidateJson('/api/reminders')
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]"><div className="mx-auto max-w-[1200px] px-5 py-6 lg:px-8">
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Automation</p><h1 className="text-2xl font-semibold">Reminders</h1></div></div><button onClick={() => setShowForm(true)} disabled={!obligations.length} className="flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:opacity-50"><Plus size={17}/> Add reminder</button></header>
    {message && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>}
    <section className="mb-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Reminder rules</p><p className="mt-2 text-3xl font-semibold">{reminders.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Active</p><p className="mt-2 text-3xl font-semibold">{enabled}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Delivery channel</p><p className="mt-2 text-xl font-semibold">Email</p><p className="mt-1 text-xs text-slate-400">Rules are stored in Supabase; delivery service is not yet connected.</p></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Reminder rules</h2><p className="mt-1 text-sm text-slate-500">Alerts linked to your workspace obligations.</p></div><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reminders..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:w-64"/></div>
      {loading ? <div className="flex p-12 justify-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin"/>Loading reminders…</div> : <div className="divide-y divide-slate-100">{filtered.map(r => <div key={r.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className={`rounded-xl p-2.5 ${r.enabled ? 'bg-violet-50 text-[#7c3aed]' : 'bg-slate-100 text-slate-400'}`}><Bell size={19}/></div><div><p className="font-semibold">{r.obligations?.title ?? 'Obligation'}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 size={14}/>Notify {r.days_before} days before expiry · Email</p></div></div><div className="flex items-center gap-3"><button onClick={() => void toggle(r)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${r.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.enabled ? 'Active' : 'Paused'}</button><button onClick={() => void remove(r.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div></div>)}{!filtered.length && <div className="p-12 text-center text-sm text-slate-500">{reminders.length ? 'No reminders match your search.' : obligations.length ? 'No reminder rules yet.' : 'Create an obligation first, then add a reminder.'}</div>}</div>}
    </section>
  </div>{showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"><form onSubmit={addReminder} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Add reminder</h2><p className="mt-1 text-sm text-slate-500">Create an email reminder for an obligation.</p></div><button type="button" onClick={() => setShowForm(false)}><X size={20}/></button></div><label className="block text-sm font-medium">Obligation<select name="obligation_id" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{obligations.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}</select></label><label className="mt-4 block text-sm font-medium">Notify before expiry<select name="days_before" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="90">90 days</option><option value="60">60 days</option><option value="30">30 days</option><option value="15">15 days</option><option value="7">7 days</option></select></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:opacity-60">{saving ? 'Saving…' : 'Add reminder'}</button></div></form></div>}</main>
}
