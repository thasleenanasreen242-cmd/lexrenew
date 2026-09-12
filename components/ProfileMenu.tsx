'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getJson } from '@/lib/client-cache'

type ProfileResponse = { profile?: { full_name?: string }; workspace?: string }

export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState('Account')
  const [workspace, setWorkspace] = useState('LexRenew Workspace')
  const [photo, setPhoto] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncPhoto = () => setPhoto(localStorage.getItem('lexrenew-profile-photo') || '')
    syncPhoto()
    window.addEventListener('lexrenew-profile-photo-updated', syncPhoto)
    return () => window.removeEventListener('lexrenew-profile-photo-updated', syncPhoto)
  }, [])

  useEffect(() => {
    if (!open || loaded) return
    let cancelled = false
    getJson<ProfileResponse>('/api/profile', 30000).then(data => {
      if (cancelled) return
      if (data.profile?.full_name?.trim()) setName(data.profile.full_name.trim())
      if (data.workspace?.trim()) setWorkspace(data.workspace.trim())
      setLoaded(true)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [open, loaded])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) { if (!menuRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  const initials = name === 'Account' ? 'U' : name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'U'
  const avatar = (classes: string) => <span className={`grid ${classes} shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5`}>{photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : initials}</span>

  return <div ref={menuRef} className="relative">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex items-center gap-2 rounded-full p-1.5 transition hover:bg-slate-100">{avatar('h-9 w-9')}<ChevronDown size={15} className="hidden text-slate-400 sm:block" /></button>
    {open && <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
      <div className="flex items-center gap-3 px-3 py-3">{avatar('h-10 w-10')}<div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{name}</p><p className="truncate text-xs text-slate-500">{workspace}</p></div></div>
      <div className="my-1 h-px bg-slate-100" />
      <Link href="/settings/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"><UserRound size={17}/> Profile</Link>
      <Link href="/settings/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"><Settings size={17}/> Settings</Link>
      <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"><LogOut size={17}/> Sign out</button>
    </div>}
  </div>
}
