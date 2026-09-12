'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarClock, CheckCircle2, ChevronRight, Clock3, FileText, LayoutDashboard, Plus, Search, ShieldCheck, TriangleAlert, Users, Sparkles, CalendarDays, ClipboardList, Settings, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Item = {
  id: string
  name: string
  type: string
  counterparty: string
  expiry_date: string
  status: 'Urgent' | 'Upcoming' | 'Healthy'
}

const types = ['Contract', 'Lease', 'Insurance', 'AMC', 'Licence', 'Certificate']

function daysUntil(date: string) {
  const target = new Date(`${date}T23:59:59`)
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000))
}

function statusFor(date: string): Item['status'] {
  const days = daysUntil(date)
  return days <= 30 ? 'Urgent' : days <= 60 ? 'Upcoming' : 'Healthy'
}

export default function Home() {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [workspace, setWorkspace] = useState('Workspace')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadDashboard() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const orgId = membership?.organization_id ?? null
    setOrganizationId(orgId)

    if (orgId) {
      const { data: org } = await supabase.from('organizations').select('name').eq('id', orgId).maybeSingle()
      if (org?.name) setWorkspace(org.name)

      const { data, error } = await supabase
        .from('obligations')
        .select('id,name,type,counterparty,expiry_date,status')
        .eq('organization_id', orgId)
        .order('expiry_date', { ascending: true })

      if (!error && data) {
        setItems(data.map(item => ({ ...item, status: statusFor(item.expiry_date) })))
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard().catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => items.filter(item => {
    const matchesType = filter === 'All' || item.type === filter
    const text = `${item.name} ${item.counterparty}`.toLowerCase()
    return matchesType && text.includes(q.toLowerCase())
  }), [items, q, filter])

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organizationId) {
      setToast('No workspace is linked to this account')
      return
    }

    setSaving(true)
    const form = new FormData(event.currentTarget)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    const expiry = String(form.get('expiry'))
    const payload = {
      organization_id: organizationId,
      name: String(form.get('name')).trim(),
      type: String(form.get('type')),
      counterparty: String(form.get('counterparty')).trim(),
      expiry_date: expiry,
      status: statusFor(expiry),
      created_by: user?.id ?? null,
    }

    const { error } = await supabase.from('obligations').insert(payload)
    if (error) {
      setToast(error.message)
    } else {
      setModal(false)
      setToast('Obligation added successfully')
      await loadDashboard()
    }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this obligation?')) return
    const { error } = await supabase.from('obligations').delete().eq('id', id)
    if (error) setToast(error.message)
    else {
      setItems(current => current.filter(item => item.id !== id))
      setToast('Obligation deleted')
    }
  }

  const due30 = items.filter(item => daysUntil(item.expiry_date) <= 30).length
  const upcoming = items.filter(item => daysUntil(item.expiry_date) > 30 && daysUntil(item.expiry_date) <= 60).length
  const onTrack = items.length ? Math.round(items.filter(item => daysUntil(item.expiry_date) > 30).length / items.length * 100) : 0
  const priority = [...items].sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date))[0]

  return <main className="min-h-screen flex">
    {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold">{toast}</div>}
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-5 flex-col">
      <div className="flex items-center gap-2 mb-10"><div className="h-9 w-9 rounded-xl bg-[#174ea6] text-white grid place-items-center font-bold">L</div><span className="text-xl font-bold tracking-tight">LexRenew</span></div>
      <nav className="space-y-1 text-sm">
        <Link href="/" className="flex gap-3 items-center px-3 py-2.5 rounded-lg bg-slate-100 font-semibold"><LayoutDashboard size={18}/>Dashboard</Link>
        <Link href="/obligations" className="flex gap-3 items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50"><ClipboardList size={18}/>Obligations</Link>
        <Link href="/documents" className="flex gap-3 items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50"><FileText size={18}/>Documents</Link>
        <Link href="/reminders" className="flex gap-3 items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50"><Bell size={18}/>Reminders</Link>
        <Link href="/calendar" className="flex gap-3 items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50"><CalendarDays size={18}/>Calendar</Link>
        <Link href="/team" className="flex gap-3 items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50"><Users size={18}/>Team</Link>
        <Link href="/settings/profile" className="flex gap-3 items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50"><Settings size={18}/>Profile & Settings</Link>
      </nav>
      <div className="mt-auto card p-4 bg-slate-50"><ShieldCheck size={20} className="text-[#174ea6]"/><p className="font-semibold text-sm mt-3">Never miss a renewal.</p><p className="text-xs text-slate-500 mt-1">LexRenew keeps every obligation visible and on time.</p></div>
    </aside>

    <section className="flex-1">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-8">
        <Link href="/settings/profile" className="group"><p className="text-xs text-slate-500">Workspace</p><p className="font-semibold group-hover:text-[#174ea6]">{workspace}</p></Link>
        <button onClick={() => setModal(true)} disabled={!organizationId} className="bg-[#174ea6] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex gap-2 items-center disabled:opacity-50"><Plus size={17}/>Add obligation</button>
      </header>

      <div className="max-w-7xl mx-auto p-5 md:p-8">
        <div className="mb-7"><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Good afternoon</h1><p className="text-slate-500 mt-1">Here’s what needs your attention.</p></div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <Stat icon={<TriangleAlert size={19}/>} label="Due in 30 days" value={String(due30)} tone="danger"/>
          <Stat icon={<Clock3 size={19}/>} label="Upcoming" value={String(upcoming)} tone="warn"/>
          <Stat icon={<FileText size={19}/>} label="Active obligations" value={String(items.length)} tone="brand"/>
          <Stat icon={<CheckCircle2 size={19}/>} label="On track" value={`${onTrack}%`} tone="ok"/>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3"><div className="h-10 w-10 rounded-xl bg-white border border-blue-100 grid place-items-center text-[#174ea6]"><Sparkles size={18}/></div><div><p className="font-bold">LexRenew intelligence</p><p className="text-sm text-slate-600 mt-1">{priority ? `Your highest-priority renewal is ${priority.name}, due in ${daysUntil(priority.expiry_date)} days.` : 'Add an obligation to start tracking renewals.'}</p></div></div>
          <Link href="/reminders" className="text-sm font-semibold text-[#174ea6] whitespace-nowrap">Set reminder <ChevronRight size={15} className="inline"/></Link>
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div><h2 className="font-bold">Renewals & obligations</h2><p className="text-sm text-slate-500">Track what is due before it becomes a problem.</p></div>
            <div className="flex gap-2"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-48 outline-none focus:ring-2 focus:ring-blue-100"/></div><select value={filter} onChange={e => setFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 text-sm"><option>All</option>{types.map(type => <option key={type}>{type}</option>)}</select></div>
          </div>

          {loading ? <div className="p-12 text-center text-slate-500">Loading your obligations…</div> : <div className="divide-y divide-slate-100">
            {filtered.map(item => <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between hover:bg-slate-50">
              <Link href="/obligations" className="flex gap-4 items-start min-w-0 flex-1"><div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center text-slate-600 shrink-0"><FileText size={18}/></div><div className="min-w-0"><div className="font-semibold truncate">{item.name}</div><div className="text-sm text-slate-500 mt-1">{item.type} · {item.counterparty}</div></div></Link>
              <div className="flex items-center gap-4 md:min-w-[380px] md:justify-end"><div className="flex items-center gap-2 text-sm text-slate-600"><CalendarClock size={16}/>{new Date(`${item.expiry_date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.status === 'Urgent' ? 'bg-red-50 text-red-700' : item.status === 'Upcoming' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{daysUntil(item.expiry_date)} days</span><button onClick={() => remove(item.id)} title="Delete obligation" className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={16}/></button><ChevronRight size={17} className="text-slate-400"/></div>
            </div>)}
            {filtered.length === 0 && <div className="p-12 text-center text-slate-500">{items.length ? 'No obligations match your search.' : 'No obligations yet. Add your first renewal to get started.'}</div>}
          </div>}
        </div>
      </div>
    </section>

    {modal && <div className="fixed inset-0 bg-slate-900/30 grid place-items-center p-5 z-40"><form onSubmit={add} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"><h2 className="text-xl font-bold">Add obligation</h2><p className="text-sm text-slate-500 mt-1 mb-5">Create a renewal record in your workspace.</p><div className="space-y-3"><input name="name" required placeholder="Document / obligation name" className="w-full border rounded-lg px-3 py-2.5"/><select name="type" className="w-full border rounded-lg px-3 py-2.5">{types.map(type => <option key={type}>{type}</option>)}</select><input name="counterparty" required placeholder="Counterparty / authority" className="w-full border rounded-lg px-3 py-2.5"/><input name="expiry" required type="date" className="w-full border rounded-lg px-3 py-2.5"/></div><div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 rounded-lg border">Cancel</button><button disabled={saving} className="px-4 py-2.5 rounded-lg bg-[#174ea6] text-white font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save obligation'}</button></div></form></div>}
  </main>
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const map: Record<string, string> = { danger: 'bg-red-50 text-red-700', warn: 'bg-amber-50 text-amber-700', brand: 'bg-blue-50 text-blue-700', ok: 'bg-emerald-50 text-emerald-700' }
  return <div className="card p-5"><div className={`w-9 h-9 rounded-lg grid place-items-center ${map[tone]}`}>{icon}</div><p className="text-sm text-slate-500 mt-4">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
}
