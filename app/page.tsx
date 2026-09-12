'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
  Sparkles,
  CalendarDays,
  ClipboardList,
  Settings,
  Trash2,
  LogIn,
} from 'lucide-react'
import ProfileMenu from '@/components/ProfileMenu'

type Item = {
  id: string
  title: string
  type: string
  counterparty: string | null
  expiry_date: string
  status: 'Urgent' | 'Upcoming' | 'Healthy'
}

const types = ['Contract', 'Lease', 'Insurance', 'AMC', 'Licence', 'Certificate', 'Compliance']
const previewItems: Item[] = [
  { id: 'preview-1', title: 'Commercial Lease Agreement', type: 'Lease', counterparty: 'Property Management', expiry_date: futureDate(18), status: 'Urgent' },
  { id: 'preview-2', title: 'Professional Indemnity Insurance', type: 'Insurance', counterparty: 'Insurance Provider', expiry_date: futureDate(42), status: 'Upcoming' },
  { id: 'preview-3', title: 'Trade Licence', type: 'Licence', counterparty: 'Licensing Authority', expiry_date: futureDate(88), status: 'Healthy' },
]

function futureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysUntil(date: string) {
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [workspace, setWorkspace] = useState('LexRenew Workspace')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guest, setGuest] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/obligations')
      if (response.status === 401) {
        setGuest(true)
        setItems(previewItems)
        setWorkspace('Dashboard preview')
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load')
      setGuest(false)
      setItems(data.obligations || [])
      if (data.organization?.name) setWorkspace(data.organization.name)
    } catch {
      setGuest(true)
      setItems(previewItems)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(
    () => items.filter(item => (filter === 'All' || item.type === filter) && `${item.title} ${item.counterparty || ''}`.toLowerCase().includes(q.toLowerCase())),
    [items, q, filter],
  )

  function requireLogin() {
    window.location.href = '/login?next=%2F'
  }

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (guest) return requireLogin()
    setSaving(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/obligations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(form.get('title')).trim(),
          type: String(form.get('type')),
          counterparty: String(form.get('counterparty')).trim(),
          expiry_date: String(form.get('expiry')),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setModal(false)
      setToast('Obligation added successfully')
      await load()
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to save')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (guest) return requireLogin()
    if (!window.confirm('Archive this obligation?')) return
    const response = await fetch(`/api/obligations/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const data = await response.json()
      setToast(data.error || 'Unable to archive')
      return
    }
    setItems(current => current.filter(item => item.id !== id))
    setToast('Obligation archived')
  }

  const due30 = items.filter(item => daysUntil(item.expiry_date) <= 30).length
  const upcoming = items.filter(item => daysUntil(item.expiry_date) > 30 && daysUntil(item.expiry_date) <= 60).length
  const onTrack = items.length ? Math.round(items.filter(item => daysUntil(item.expiry_date) > 30).length / items.length * 100) : 0
  const priority = [...items].sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date))[0]
  const protectedLink = (path: string) => guest ? `/login?next=${encodeURIComponent(path)}` : path

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950 md:flex">
      {toast && <div className="fixed right-5 top-5 z-[70] rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">{toast}</div>}

      <aside className="hidden min-h-screen w-[252px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
        <Link href="/" aria-label="LexRenew dashboard" className="mb-8 block px-2">
          <img src="/lexrenew-logo.svg" alt="LexRenew" className="h-12 w-auto max-w-full" />
        </Link>
        <nav className="space-y-1 text-sm">
          <Nav href="/" active icon={<LayoutDashboard size={18}/>} label="Dashboard" />
          <Nav href={protectedLink('/obligations')} icon={<ClipboardList size={18}/>} label="Obligations" />
          <Nav href={protectedLink('/documents')} icon={<FileText size={18}/>} label="Documents" />
          <Nav href={protectedLink('/reminders')} icon={<Bell size={18}/>} label="Reminders" />
          <Nav href={protectedLink('/calendar')} icon={<CalendarDays size={18}/>} label="Calendar" />
          <Nav href={protectedLink('/team')} icon={<Users size={18}/>} label="Team" />
          <Nav href={protectedLink('/settings/profile')} icon={<Settings size={18}/>} label="Settings" />
        </nav>
        <div className="mt-auto rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <ShieldCheck size={19} className="text-[#7c3aed]"/>
          <p className="mt-3 text-sm font-semibold">Renewals under control</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Track dates, documents and reminders from one workspace.</p>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{guest ? 'Explore LexRenew' : 'Workspace'}</p>
            <p className="truncate text-sm font-semibold text-slate-800">{workspace}</p>
          </div>
          {guest ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign in</Link>
              <Link href="/login?mode=signup" className="flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9]"><LogIn size={16}/>Get started</Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setModal(true)} className="hidden items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] sm:flex"><Plus size={16}/>Add obligation</button>
              <ProfileMenu />
            </div>
          )}
        </header>

        <div className="mx-auto max-w-7xl p-5 md:p-8 lg:p-10">
          {guest && (
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 sm:flex-row sm:items-center">
              <div><p className="font-semibold text-[#7c3aed]">Demo workspace</p><p className="mt-1 text-sm text-slate-600">Explore the workflow with sample data, then sign in to create your own workspace.</p></div>
              <Link href="/login?mode=signup" className="shrink-0 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d28d9]">Start using LexRenew</Link>
            </div>
          )}

          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h1 className="text-3xl font-semibold tracking-tight md:text-[34px]">{guest ? 'Stay ahead of every renewal.' : 'Dashboard'}</h1><p className="mt-2 text-sm text-slate-500">{guest ? 'See how LexRenew keeps obligations visible before they become urgent.' : 'A clear view of what needs attention across your workspace.'}</p></div>
            {!guest && <button onClick={() => setModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] sm:hidden"><Plus size={16}/>Add obligation</button>}
          </div>

          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={<TriangleAlert size={18}/>} label="Due in 30 days" value={String(due30)} />
            <Stat icon={<Clock3 size={18}/>} label="Upcoming" value={String(upcoming)} />
            <Stat icon={<FileText size={18}/>} label="Active obligations" value={String(items.length)} />
            <Stat icon={<CheckCircle2 size={18}/>} label="On track" value={`${onTrack}%`} />
          </div>

          <div className="mb-6 flex gap-3 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-[#7c3aed]"><Sparkles size={18}/></div>
            <div><p className="font-semibold">LexRenew intelligence</p><p className="mt-1 text-sm leading-6 text-slate-500">{priority ? `Your highest-priority ${guest ? 'example ' : ''}renewal is ${priority.title}, due in ${daysUntil(priority.expiry_date)} days.` : 'Add an obligation to start tracking renewals.'}</p></div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
              <div><h2 className="font-semibold">Renewals & obligations</h2><p className="mt-1 text-sm text-slate-500">{guest ? 'Sample records for the demo workspace.' : 'Track what is due before it becomes a problem.'}</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={q} onChange={event => setQ(event.target.value)} placeholder="Search obligations" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#7c3aed] sm:w-56"/></div>
                <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#7c3aed]"><option>All</option>{types.map(type => <option key={type}>{type}</option>)}</select>
              </div>
            </div>
            {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading dashboard…</div> : (
              <div className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <div key={item.id} className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 md:flex-row md:items-center">
                    <Link href={guest ? '/login?next=%2Fobligations' : '/obligations'} className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><FileText size={18}/></div>
                      <div className="min-w-0"><div className="truncate font-semibold">{item.title}</div><div className="mt-1 truncate text-sm text-slate-500">{item.type} · {item.counterparty || 'No counterparty'}</div></div>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <div className="text-sm text-slate-500"><CalendarClock size={15} className="mr-1 inline"/>{new Date(`${item.expiry_date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Urgent' ? 'bg-red-50 text-red-700' : item.status === 'Upcoming' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{daysUntil(item.expiry_date)} days</span>
                      {!guest && <button onClick={() => void remove(item.id)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button>}
                      <ChevronRight size={17} className="text-slate-300"/>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No obligations match your search.</div>}
              </div>
            )}
          </section>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-5 backdrop-blur-sm">
          <form onSubmit={add} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">Add obligation</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">Create a renewal record in your workspace.</p>
            <div className="space-y-3">
              <input name="title" required placeholder="Document / obligation name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#7c3aed]"/>
              <select name="type" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#7c3aed]">{types.map(type => <option key={type}>{type}</option>)}</select>
              <input name="counterparty" placeholder="Counterparty / authority" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#7c3aed]"/>
              <input name="expiry" required type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#7c3aed]"/>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button><button disabled={saving} className="rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d28d9] disabled:opacity-60">{saving ? 'Saving…' : 'Save obligation'}</button></div>
          </form>
        </div>
      )}
    </main>
  )
}

function Nav({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return <Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${active ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>{icon}<span>{label}</span></Link>
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-[#7c3aed]">{icon}</div><span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-300">Live</span></div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p></div>
}
