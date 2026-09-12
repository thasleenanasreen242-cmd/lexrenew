'use client'

type Entry = { expiresAt: number; data?: unknown; promise?: Promise<unknown> }

const cache = new Map<string, Entry>()

export class ApiRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export async function getJson<T>(url: string, ttlMs = 15000): Promise<T> {
  const now = Date.now()
  const current = cache.get(url)
  if (current?.data !== undefined && current.expiresAt > now) return current.data as T
  if (current?.promise) return current.promise as Promise<T>

  const promise = fetch(url)
    .then(async response => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new ApiRequestError(data?.error || `Request failed (${response.status})`, response.status)
      cache.set(url, { data, expiresAt: Date.now() + ttlMs })
      return data as T
    })
    .catch(error => {
      cache.delete(url)
      throw error
    })

  cache.set(url, { expiresAt: now + ttlMs, promise })
  return promise
}

export function setCachedJson<T>(url: string, data: T, ttlMs = 15000) {
  cache.set(url, { data, expiresAt: Date.now() + ttlMs })
}

export function invalidateJson(...urls: string[]) {
  urls.forEach(url => cache.delete(url))
}
