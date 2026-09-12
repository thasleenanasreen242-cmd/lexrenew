'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import Link from 'next/link'

type Item = { name: string; type: string; expiry: string }
const seed: Item[] = [
  { name: 'Commercial Lease Agreement', type: 'Lease', expiry: '2026-09-18' },
  { name: 'Professional Indemnity Insurance', type: 'Insurance', expiry: '2026-09-27' },
  { name: 'Annual Maintenance Contract', type: 'AMC', expiry: '2026-10-12' },
  { name: 'Trade Licence', type: 'Licence', expiry: '2026-11-08' },
  { name: 'Supplier Framework Agreement', type: 'Contract', expiry: '2026-12-16' },
]

export default function CalendarPage() {
  const [date, setDate] = useState(new Date(2026, 8, 1))
  const [items, setItems] = useState<Item[]>(seed)
  useEffect(() => { try { const saved = localStorage.getItem('lexrenew-obligations'); if (saved) setItems(JSON.parse(saved).map((x: Item) => ({ ...x, expiry: normalise(x.expiry) }))) } catch {} }, [])
  const year = date.getFullYear(), month = date.getMonth()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: first + days }, (_, i) => i < first ? null : i - first + 1)
  const byDay = useMemo(() => { const map: Record<number, Item[]> = {}; items.forEach(x => { const d = new Date(x.expiry); if (d.getFullYear() === year && d.getMonth() === month) (map[d.getDate()] ||= []).push(x) }); return map }, [items, year, month])
  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]"><div className="mx-auto max-w-[1200px] px-5 py-6 lg:px-8">
    <header className="mb-7 flex items-center justify-between"><div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Planning</p><h1 className="text-2xl font-semibold">Renewal calendar</h1></div></div></header>
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><button onClick={() => setDate(new Date(year, month - 1, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft size={19}/></button><h2 className="font-semibold text-lg flex items-center gap-2"><CalendarDays size={19}/> {date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2><button onClick={() => setDate(new Date(year, month + 1, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronRight size={19}/></button></div><div className="grid grid-cols-7 border-b border-slate-100">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="p-3 text-center text-xs font-semibold text-slate-400">{d}</div>)}</div><div className="grid grid-cols-7">{cells.map((day, i) => <div key={i} className="min-h-28 border-b border-r border-slate-100 p-2">{day && <><p className="text-sm font-semibold text-slate-600">{day}</p><div className="mt-2 space-y-1">{(byDay[day] || []).map(x => <div key={x.name} className="rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-[#084888]" title={x.name}>{x.name}</div>)}</div></>}</div>)}</div></section>
  </div></main>
}
function normalise(value: string) { if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const d = new Date(value); return Number.isNaN(d.getTime()) ? '2099-12-31' : d.toISOString().slice(0, 10) }
