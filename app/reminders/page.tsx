'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bell, Check, Plus, Trash2, X, Clock3 } from 'lucide-react'
import Link from 'next/link'

type Reminder = { id: string; obligation: string; daysBefore: number; channel: 'Email'; enabled: boolean }

const defaults: Reminder[] = [
  { id: 'r1', obligation: 'Commercial Lease Agreement', daysBefore: 30, channel: 'Email', enabled: true },
  { id: 'r2', obligation: 'Professional Indemnity Insurance', daysBefore: 30, channel: 'Email', enabled: true },
  { id: 'r3', obligation: 'Annual Maintenance Contract', daysBefore: 30, channel: 'Email', enabled: true },
  { id: 'r4', obligation: 'Trade Licence', daysBefore: 60, channel: 'Email', enabled: true },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(defaults)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('lexrenew-reminders')
    if (saved) {
      try { setReminders(JSON.parse(saved)) } catch { localStorage.removeItem('lexrenew-reminders') }
    }
  }, [])
  useEffect(() => { localStorage.setItem('lexrenew-reminders', JSON.stringify(reminders)) }, [reminders])

  const enabled = useMemo(() => reminders.filter(r => r.enabled).length, [reminders])
  const filtered = useMemo(() => reminders.filter(r => r.obligation.toLowerCase().includes(search.toLowerCase())), [reminders, search])

  function addReminder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const obligation = String(form.get('obligation') || '').trim()
    if (!obligation) return
    setReminders(r => [{ id: crypto.randomUUID(), obligation, daysBefore: Number(form.get('daysBefore')), channel: 'Email', enabled: true }, ...r])
    setShowForm(false)
    e.currentTarget.reset()
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]">
    <div className="mx-auto max-w-[1200px] px-5 py-6 lg:px-8">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Automation</p><h1 className="text-2xl font-semibold tracking-tight">Reminders</h1></div></div>
        <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#084888] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><Plus size={17}/> Add reminder</button>
      </header>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Reminder rules</p><p className="mt-2 text-3xl font-semibold">{reminders.length}</p><p className="mt-1 text-xs text-slate-400">Configured rules</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Active</p><p className="mt-2 text-3xl font-semibold">{enabled}</p><p className="mt-1 text-xs text-emerald-600">Ready for delivery</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Default delivery</p><p className="mt-2 text-xl font-semibold">Email</p><p className="mt-1 text-xs text-slate-400">Resend integration can be connected next</p></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Reminder rules</h2><p className="mt-1 text-sm text-slate-500">Alert your team before important contracts and documents expire.</p></div><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reminders..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#084888] sm:w-64"/></div>
        <div className="divide-y divide-slate-100">{filtered.map(r => <div key={r.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className={`rounded-xl p-2.5 ${r.enabled ? 'bg-blue-50 text-[#084888]' : 'bg-slate-100 text-slate-400'}`}><Bell size={19}/></div><div className="min-w-0"><p className="truncate font-semibold">{r.obligation}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 size={14}/> Notify {r.daysBefore} days before expiry · {r.channel}</p></div></div><div className="flex items-center gap-3"><button onClick={() => setReminders(rs => rs.map(x => x.id === r.id ? {...x, enabled: !x.enabled} : x))} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${r.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.enabled ? 'Active' : 'Paused'}</button><button aria-label={`Delete ${r.obligation}`} onClick={() => setReminders(rs => rs.filter(x => x.id !== r.id))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div></div>)}{!filtered.length && <div className="p-12 text-center text-sm text-slate-500">No reminders match your search.</div>}</div>
      </section>

      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5"><div className="flex gap-3"><Check className="mt-0.5 shrink-0 text-emerald-600" size={18}/><div><p className="font-semibold">Automation roadmap</p><p className="mt-1 text-sm leading-6 text-slate-500">Your reminder preferences are stored locally for now. The production version will connect these rules to Neon and email delivery so LexRenew can send scheduled alerts and keep a delivery history.</p></div></div></div>
    </div>

    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"><form onSubmit={addReminder} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Add reminder</h2><p className="mt-1 text-sm text-slate-500">Create an alert rule for an obligation.</p></div><button type="button" aria-label="Close" onClick={() => setShowForm(false)}><X size={20}/></button></div><label className="block text-sm font-medium">Obligation<input name="obligation" required placeholder="e.g. Trade Licence" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#084888]"/></label><label className="mt-4 block text-sm font-medium">Notify before expiry<select name="daysBefore" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="90">90 days</option><option value="60">60 days</option><option value="30">30 days</option><option value="15">15 days</option><option value="7">7 days</option></select></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button className="rounded-xl bg-[#084888] px-5 py-2.5 text-sm font-semibold text-white">Add reminder</button></div></form></div>}
  </main>
}
