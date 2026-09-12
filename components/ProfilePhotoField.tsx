'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'

export default function ProfilePhotoField({ name }: { name: string }) {
  const [photo, setPhoto] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPhoto(localStorage.getItem('lexrenew-profile-photo') || '')
  }, [])

  const initials = name.trim()
    ? name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
    : 'U'

  function choosePhoto(file?: File) {
    if (!file || !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      setPhoto(reader.result)
      localStorage.setItem('lexrenew-profile-photo', reader.result)
      window.dispatchEvent(new Event('lexrenew-profile-photo-updated'))
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setPhoto('')
    localStorage.removeItem('lexrenew-profile-photo')
    if (inputRef.current) inputRef.current.value = ''
    window.dispatchEvent(new Event('lexrenew-profile-photo-updated'))
  }

  return (
    <div className="border-b border-slate-100 p-6">
      <p className="text-sm font-semibold text-slate-700">Profile photo</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 text-xl font-semibold text-white ring-4 ring-violet-50">
          {photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : initials}
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Camera size={16}/>{photo ? 'Change photo' : 'Upload photo'}
            </button>
            {photo && <button type="button" onClick={removePhoto} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"><Trash2 size={16}/>Remove</button>}
          </div>
          <p className="mt-2 text-xs text-slate-400">JPG, PNG or WebP. Maximum 2 MB.</p>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => choosePhoto(event.target.files?.[0])} className="hidden" />
        </div>
      </div>
    </div>
  )
}
