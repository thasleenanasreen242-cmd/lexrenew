'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText, Plus, Search, Trash2, X } from 'lucide-react'
import Link from 'next/link'

type DocumentItem = { id: string; name: string; type: string; linkedObligation: string; uploaded: string; size: string }

const initialDocuments: DocumentItem[] = [
  { id: 'd1', name: 'Commercial Lease Agreement.pdf', type: 'Contract', linkedObligation: 'Commercial Lease Agreement', uploaded: '12 Sep 2026', size: '1.8 MB' },
  { id: 'd2', name: 'Professional Indemnity Policy.pdf', type: 'Insurance', linkedObligation: 'Professional Indemnity Insurance', uploaded: '08 Sep 2026', size: '942 KB' },
  { id: 'd3', name: 'Trade Licence Certificate.pdf', type: 'Licence', linkedObligation: 'Trade Licence', uploaded: '02 Sep 2026', size: '620 KB' },
]

const documentTypes = ['Contract', 'Licence', 'Insurance', 'Lease', 'AMC', 'Certificate', 'Compliance']

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { const saved = localStorage.getItem('lexrenew-documents'); if (saved) setDocuments(JSON.parse(saved)) }, [])
  useEffect(() => { localStorage.setItem('lexrenew-documents', JSON.stringify(documents)) }, [documents])

  const filtered = useMemo(() => documents.filter(d => `${d.name} ${d.type} ${d.linkedObligation}`.toLowerCase().includes(query.toLowerCase())), [documents, query])

  function addDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const file = form.get('file') as File | null
    const name = file?.name || String(form.get('name') || '')
    if (!name) return
    setDocuments(current => [{ id: crypto.randomUUID(), name, type: String(form.get('type')), linkedObligation: String(form.get('linkedObligation')), uploaded: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), size: file?.size ? `${Math.max(1, Math.round(file.size / 1024))} KB` : '—' }, ...current])
    setShowForm(false)
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]"><div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
    <header className="mb-7 flex items-center justify-between"><div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><h1 className="text-2xl font-semibold tracking-tight">Documents</h1></div></div><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-[#084888] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Add document</button></header>
    <section className="mb-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Documents</p><p className="mt-2 text-3xl font-semibold">{documents.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Linked obligations</p><p className="mt-2 text-3xl font-semibold">{new Set(documents.map(d => d.linkedObligation).filter(Boolean)).size}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Document coverage</p><p className="mt-2 text-3xl font-semibold">{documents.length ? 'Ready' : 'Start'}</p></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-4"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search documents..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#084888]"/></div></div><div className="divide-y divide-slate-100">{filtered.map(doc => <div key={doc.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70"><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-[#084888]"><FileText size={20}/></div><div><p className="font-semibold">{doc.name}</p><p className="mt-1 text-sm text-slate-500">{doc.type} · {doc.linkedObligation || 'Unlinked'}</p></div></div><div className="flex items-center gap-5 text-sm text-slate-500"><span>{doc.size}</span><span>{doc.uploaded}</span><button onClick={() => setDocuments(current => current.filter(x => x.id !== doc.id))} className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div></div>)}{filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No documents found.</div>}</div></section>
  </div>{showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"><form onSubmit={addDocument} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Add document</h2><p className="mt-1 text-sm text-slate-500">Attach a document to a legal or compliance obligation.</p></div><button type="button" onClick={() => setShowForm(false)}><X size={20}/></button></div><div className="space-y-4"><label className="block text-sm font-medium">Document file<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2.5 text-sm"/></label><label className="block text-sm font-medium">Document name<input name="name" placeholder="Optional if uploading a file" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label><label className="block text-sm font-medium">Type<select name="type" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{documentTypes.map(t => <option key={t}>{t}</option>)}</select></label><label className="block text-sm font-medium">Linked obligation<input name="linkedObligation" placeholder="e.g. Commercial Lease Agreement" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button className="rounded-xl bg-[#084888] px-5 py-2.5 text-sm font-semibold text-white">Add document</button></div></form></div>}</main>
}
