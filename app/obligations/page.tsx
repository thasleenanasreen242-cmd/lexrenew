'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Obligation = {
  id: string
  title: string
  type: string
  counterparty: string
  reference_number: string
  start_date: string
  expiry_date: string
  renewal_period_months: number | null
  auto_renew: boolean
  owner_name: string
  status: 'Urgent' | 'Upcoming' | 'Healthy'
  notes: string
  archived_at: string | null
}

const types = ['Contract', 'Licence', 'Insurance', 'Lease', 'AMC', 'Certificate', 'Compliance']

function daysUntil(date: string) {
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

function statusFor(date: string): Obligation['status'] {
  const days = daysUntil(date)
  return days <= 30 ? 'Urgent' : days <= 60 ? 'Upcoming' : 'Healthy'
}

const emptyForm: Obligation = {
  id: '', title: '', type: 'Contract', counterparty: '', reference_number: '', start_date: '', expiry_date: '',
  renewal_period_months: null, auto_renew: false, owner_name: '', status: 'Upcoming', notes: '', archived_at: null,
}

export default function ObligationsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Obligation[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [editing, setEditing] = useState<Obligation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('obligations')
      .select('id,title,type,counterparty,reference_number,start_date,expiry_date,renewal_period_months,auto_renew,owner_name,status,notes,archived_at')
      .is('archived_at', null)
      .order('expiry_date', { ascending: true })
    if (error) setToast(error.message)
    setItems((data || []).map(item => ({ ...item, status: statusFor(item.expiry_date) })))
    setLoading(false)
  }

  useEffect(() => { load().catch(() => setLoading(false)) }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t) }, [toast])

  const filtered = useMemo(() => items.filter(item => {
    const matchesQuery = `${item.title} ${item.counterparty || ''} ${item.reference_number || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (type === 'All' || item.type === type)
  }), [items, query, type])

  async function save(item: Obligation) {
    setSaving(true)
    const payload = {
      title: item.title.trim(), type: item.type, counterparty: item.counterparty.trim() || null,
      reference_number: item.reference_number.trim() || null, start_date: item.start_date || null,
      expiry_date: item.expiry_date, renewal_period_months: item.renewal_period_months || null,
      auto_renew: item.auto_renew, owner_name: item.owner_name.trim() || null,
      status: statusFor(item.expiry_date), notes: item.notes.trim() || null,
    }
    const result = item.id
      ? await supabase.from('obligations').update(payload).eq('id', item.id)
      : await supabase.from('obligations').insert(payload)
    if (result.error) setToast(result.error.message)
    else { setShowForm(false); setEditing(null); setToast(item.id ? 'Obligation updated' : 'Obligation created'); await load() }
    setSaving(false)
  }

  async function archive(id: string) {
    if (!window.confirm('Archive this obligation?')) return
    const { error } = await supabase.from('obligations').update({ archived_at: new Date().toISOString() }).eq('id', id)
    if (error) setToast(error.message); else { setItems(current => current.filter(x => x.id !== id)); setToast('Obligation archived') }
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]">
    {toast && <div className="fixed right-5 top-5 z-[60] rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
      <header className="mb-7 flex items-center justify-between"><div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><h1 className="text-2xl font-semibold tracking-tight">Obligations</h1></div></div><button onClick={() => { setEditing({ ...emptyForm, id: '' }); setShowForm(true) }} className="flex items-center gap-2 rounded-xl bg-[#084888] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#06396d]"><Plus size={17}/> Add obligation</button></header>
      <section className="mb-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total obligations</p><p className="mt-2 text-3xl font-semibold">{items.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Due within 30 days</p><p className="mt-2 text-3xl font-semibold">{items.filter(x => daysUntil(x.expiry_date) <= 30).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Healthy</p><p className="mt-2 text-3xl font-semibold">{items.filter(x => daysUntil(x.expiry_date) > 60).length}</p></div></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search obligations..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#084888]"/></div><div className="relative"><select value={type} onChange={e => setType(e.target.value)} className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm"><option>All</option>{types.map(t => <option key={t}>{t}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16}/></div></div>{loading ? <div className="p-12 text-center text-sm text-slate-500">Loading obligations…</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Obligation</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Counterparty</th><th className="px-4 py-3">Renewal</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(item => { const days = daysUntil(item.expiry_date); return <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-slate-400">{item.reference_number || 'No reference'}</p></td><td className="px-4 py-4 text-slate-600">{item.type}</td><td className="px-4 py-4 text-slate-600">{item.counterparty || '—'}</td><td className="px-4 py-4"><p className="font-medium">{new Date(item.expiry_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</p><p className={`text-xs ${days < 0 ? 'text-red-600' : 'text-slate-400'}`}>{days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}</p></td><td className="px-4 py-4 text-slate-600">{item.owner_name || 'Unassigned'}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Urgent' ? 'bg-red-50 text-red-600' : item.status === 'Upcoming' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.status}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-1"><button onClick={() => { setEditing(item); setShowForm(true) }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15}/></button><button onClick={() => archive(item.id)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button></div></td></tr>})}</tbody></table></div>}{!loading && filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No obligations match your search.</div>}</section>
    </div>
    {showForm && <ObligationForm initial={editing || emptyForm} saving={saving} onClose={() => {setShowForm(false);setEditing(null)}} onSave={save}/>} 
  </main>
}

function ObligationForm({ initial, saving, onClose, onSave }: { initial: Obligation; saving: boolean; onClose: () => void; onSave: (item: Obligation) => void }) {
  const [form, setForm] = useState<Obligation>(initial)
  const set = <K extends keyof Obligation>(key: K, value: Obligation[K]) => setForm(f => ({ ...f, [key]: value }))
  function submit(e: React.FormEvent) { e.preventDefault(); if (!form.title.trim() || !form.expiry_date) return; onSave(form) }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"><form onSubmit={submit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{initial.id ? 'Edit obligation' : 'Add obligation'}</h2><p className="mt-1 text-sm text-slate-500">Track a legal or compliance renewal.</p></div><button type="button" onClick={onClose}><X size={20}/></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium sm:col-span-2">Title<input required value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Commercial Lease Agreement" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#084888]"/></label><label className="text-sm font-medium">Type<select value={form.type} onChange={e=>set('type',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal">{types.map(t=><option key={t}>{t}</option>)}</select></label><label className="text-sm font-medium">Counterparty<input value={form.counterparty} onChange={e=>set('counterparty',e.target.value)} placeholder="Company or authority" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-medium">Reference number<input value={form.reference_number} onChange={e=>set('reference_number',e.target.value)} placeholder="Optional" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-medium">Owner<input value={form.owner_name} onChange={e=>set('owner_name',e.target.value)} placeholder="Person responsible" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-medium">Start date<input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-medium">Expiry / renewal date<input required type="date" value={form.expiry_date} onChange={e=>set('expiry_date',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-medium">Renewal period<select value={form.renewal_period_months ?? ''} onChange={e=>set('renewal_period_months',e.target.value ? Number(e.target.value) : null)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"><option value="">Not specified</option><option value="1">Monthly</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option><option value="24">24 months</option><option value="36">36 months</option></select></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={form.auto_renew} onChange={e=>set('auto_renew',e.target.checked)} className="h-4 w-4"/>Auto-renews unless cancelled</label><label className="text-sm font-medium sm:col-span-2">Notes<textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Important terms, renewal instructions or compliance notes" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#084888]"/></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving} className="rounded-xl bg-[#084888] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : initial.id ? 'Save changes' : 'Create obligation'}</button></div></form></div>
}
