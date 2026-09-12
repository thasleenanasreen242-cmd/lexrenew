'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import Link from 'next/link'

type Obligation = {
  id: string
  title: string
  type: string
  counterparty: string
  reference: string
  expiry: string
  owner: string
  status: 'Urgent' | 'Upcoming' | 'Healthy'
  notes: string
}

const initialData: Obligation[] = [
  { id: '1', title: 'Commercial Lease Agreement', type: 'Lease', counterparty: 'Harbor Properties LLC', reference: 'LSE-2026-014', expiry: '2026-09-18', owner: 'Aisha', status: 'Urgent', notes: 'Review renewal terms and rent escalation clause.' },
  { id: '2', title: 'Professional Indemnity Insurance', type: 'Insurance', counterparty: 'ABC Insurance', reference: 'POL-88421', expiry: '2026-09-27', owner: 'Sibi', status: 'Urgent', notes: 'Confirm coverage before renewal.' },
  { id: '3', title: 'Annual Maintenance Contract', type: 'AMC', counterparty: 'FlowTech Services', reference: 'AMC-2026-31', expiry: '2026-10-12', owner: 'Aisha', status: 'Upcoming', notes: 'Request updated commercial proposal.' },
  { id: '4', title: 'Trade Licence', type: 'Licence', counterparty: 'Department of Commerce', reference: 'LIC-2026-009', expiry: '2026-11-08', owner: 'Sibi', status: 'Upcoming', notes: 'Prepare required compliance documents.' },
  { id: '5', title: 'Supplier Framework Agreement', type: 'Contract', counterparty: 'Vertex Industrial', reference: 'SFA-2026-18', expiry: '2026-12-16', owner: 'Aisha', status: 'Healthy', notes: '' },
]

const types = ['Contract', 'Licence', 'Insurance', 'Lease', 'AMC', 'Certificate', 'Compliance']

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

export default function ObligationsPage() {
  const [items, setItems] = useState<Obligation[]>(initialData)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [editing, setEditing] = useState<Obligation | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lexrenew-obligations')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('lexrenew-obligations', JSON.stringify(items))
  }, [items])

  const filtered = useMemo(() => items.filter(item => {
    const matchesQuery = `${item.title} ${item.counterparty} ${item.reference}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (type === 'All' || item.type === type)
  }), [items, query, type])

  function remove(id: string) {
    if (confirm('Delete this obligation?')) setItems(items.filter(item => item.id !== id))
  }

  function save(item: Obligation) {
    setItems(current => current.some(x => x.id === item.id) ? current.map(x => x.id === item.id ? item : x) : [item, ...current])
    setShowForm(false)
    setEditing(null)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#101828]">
      <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50"><ArrowLeft size={18} /></Link>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><h1 className="text-2xl font-semibold tracking-tight">Obligations</h1></div>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="flex items-center gap-2 rounded-xl bg-[#084888] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#06396d]"><Plus size={17} /> Add obligation</button>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total obligations</p><p className="mt-2 text-3xl font-semibold">{items.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Due within 30 days</p><p className="mt-2 text-3xl font-semibold">{items.filter(x => daysUntil(x.expiry) <= 30).length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Healthy</p><p className="mt-2 text-3xl font-semibold">{items.filter(x => daysUntil(x.expiry) > 60).length}</p></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search obligations..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#084888]" /></div>
            <div className="relative"><select value={type} onChange={e => setType(e.target.value)} className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm"><option>All</option>{types.map(t => <option key={t}>{t}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16}/></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Obligation</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Counterparty</th><th className="px-4 py-3">Renewal</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(item => { const days = daysUntil(item.expiry); return <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-slate-400">{item.reference}</p></td><td className="px-4 py-4 text-slate-600">{item.type}</td><td className="px-4 py-4 text-slate-600">{item.counterparty}</td><td className="px-4 py-4"><p className="font-medium">{new Date(item.expiry).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}</p><p className="text-xs text-slate-400">{days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}</p></td><td className="px-4 py-4 text-slate-600">{item.owner}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Urgent' ? 'bg-red-50 text-red-600' : item.status === 'Upcoming' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.status}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-1"><button onClick={() => {setEditing(item);setShowForm(true)}} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15}/></button><button onClick={() => remove(item.id)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button></div></td></tr> })}</tbody></table></div>
          {filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No obligations match your search.</div>}
        </section>
      </div>
      {showForm && <ObligationForm initial={editing} onClose={() => {setShowForm(false);setEditing(null)}} onSave={save} />}
    </main>
  )
}

function ObligationForm({ initial, onClose, onSave }: { initial: Obligation | null, onClose: () => void, onSave: (item: Obligation) => void }) {
  const [form, setForm] = useState<Obligation>(initial || {id: crypto.randomUUID(), title:'', type:'Contract', counterparty:'', reference:'', expiry:'', owner:'', status:'Upcoming', notes:''})
  const set = (key: keyof Obligation, value: string) => setForm(f => ({...f, [key]: value}))
  function submit(e: React.FormEvent) { e.preventDefault(); if (!form.title || !form.counterparty || !form.expiry) return; const d = daysUntil(form.expiry); onSave({...form, status: d <= 30 ? 'Urgent' : d <= 60 ? 'Upcoming' : 'Healthy'}) }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"><form onSubmit={submit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{initial ? 'Edit obligation' : 'Add obligation'}</h2><p className="mt-1 text-sm text-slate-500">Track a legal or compliance renewal.</p></div><button type="button" onClick={onClose}><X size={20}/></button></div><div className="grid gap-4 sm:grid-cols-2">{([['title','Title','e.g. Commercial Lease Agreement'],['counterparty','Counterparty','Company or authority'],['reference','Reference number','Optional'],['owner','Owner','Person responsible']] as const).map(([key,label,placeholder]) => <label key={key} className="text-sm font-medium">{label}<input value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#084888]" /></label>)}<label className="text-sm font-medium">Type<select value={form.type} onChange={e=>set('type',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal">{types.map(t=><option key={t}>{t}</option>)}</select></label><label className="text-sm font-medium">Renewal date<input type="date" value={form.expiry} onChange={e=>set('expiry',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label><label className="text-sm font-medium sm:col-span-2">Notes<textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Important terms, renewal instructions or compliance notes" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#084888]" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button className="rounded-xl bg-[#084888] px-5 py-2.5 text-sm font-semibold text-white">{initial ? 'Save changes' : 'Create obligation'}</button></div></form></div>
}
