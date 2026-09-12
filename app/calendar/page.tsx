'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Item = { id: string; title: string; type: string; expiry_date: string }

export default function CalendarPage() {
  const [date, setDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/obligations')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load renewals')
        setItems(Array.isArray(data) ? data : data.obligations ?? [])
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load renewals'))
      .finally(() => setLoading(false))
  }, [])

  const year = date.getFullYear()
  const month = date.getMonth()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: first + days }, (_, i) => i < first ? null : i - first + 1)
  const byDay = useMemo(() => {
    const map: Record<number, Item[]> = {}
    items.forEach(item => {
      const [y, m, d] = item.expiry_date.split('-').map(Number)
      if (y === year && m - 1 === month) (map[d] ||= []).push(item)
    })
    return map
  }, [items, year, month])

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]"><div className="mx-auto max-w-[1200px] px-5 py-6 lg:px-8">
    <header className="mb-7 flex items-center justify-between"><div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Planning</p><h1 className="text-2xl font-semibold">Renewal calendar</h1></div></div></header>
    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><button onClick={() => setDate(new Date(year, month - 1, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft size={19}/></button><h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays size={19}/> {date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2><button onClick={() => setDate(new Date(year, month + 1, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronRight size={19}/></button></div>
      {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin"/>Loading renewals…</div> : <><div className="grid grid-cols-7 border-b border-slate-100">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="p-3 text-center text-xs font-semibold text-slate-400">{d}</div>)}</div><div className="grid grid-cols-7">{cells.map((day, i) => <div key={i} className="min-h-28 border-b border-r border-slate-100 p-2">{day && <><p className="text-sm font-semibold text-slate-600">{day}</p><div className="mt-2 space-y-1">{(byDay[day] || []).map(item => <Link href={`/obligations/${item.id}`} key={item.id} className="block truncate rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-[#084888]" title={`${item.title} · ${item.type}`}>{item.title}</Link>)}</div></>}</div>)}</div></>}
    </section>
  </div></main>
}
