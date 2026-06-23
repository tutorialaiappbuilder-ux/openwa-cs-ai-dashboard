const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * apiFetch - Client wrapper untuk memanggil API backend.
 * Jika development, /api akan di-proxy ke localhost:4000 oleh Vite.
 * Jika production, VITE_API_URL dapat dikonfigurasi untuk menunjuk ke host lain.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`

  const defaultHeaders = {}
  
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}
