'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Mail, Users } from 'lucide-react'
import Link from 'next/link'

type Member = { id: string; name: string; email: string; role: 'Owner' | 'Admin' | 'Member' }

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [workspace, setWorkspace] = useState('LexRenew Workspace')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/team')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load team')
        setMembers(data.members ?? [])
        if (data.workspace?.name) setWorkspace(data.workspace.name)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load team'))
      .finally(() => setLoading(false))
  }, [])

  return <main className="min-h-screen bg-[#f7f8fa] text-[#101828]"><div className="mx-auto max-w-[1000px] px-5 py-6 lg:px-8"><header className="mb-7 flex items-center justify-between"><div className="flex items-center gap-4"><Link href="/" className="rounded-xl border border-slate-200 bg-white p-2.5"><ArrowLeft size={18}/></Link><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{workspace}</p><h1 className="text-2xl font-semibold">Team</h1></div></div></header><section className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-[#084888]"><Users size={20}/></div><div><h2 className="font-semibold">Workspace members</h2><p className="text-sm text-slate-500">Members with access to this Supabase workspace.</p></div></div></div>{loading ? <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/>Loading team…</div> : error ? <div className="p-6 text-sm text-red-600">{error}</div> : <div className="divide-y divide-slate-100">{members.map(member => <div key={member.id} className="flex items-center justify-between p-5"><div><p className="font-semibold">{member.name}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Mail size={14}/>{member.email}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{member.role}</span></div>)}{members.length === 0 && <div className="p-6 text-sm text-slate-500">No workspace members found.</div>}</div>}</section><p className="mt-4 text-xs text-slate-500">Invitations will be enabled with a server-side Supabase invitation flow; this page no longer stores fake members in your browser.</p></div></main>
}
