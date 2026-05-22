const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  return res.json()
}

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  return res.json()
}
