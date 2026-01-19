// API base URL - uses environment variable in production, proxies in dev
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Helper for authenticated requests
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const fullUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`
    const res = await fetch(fullUrl, { ...options, headers })

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(error.detail)
    }

    if (res.status === 204) return null
    return res.json()
}

// ========== Stats ==========
export async function getStats() {
    return authFetch('/stats')
}

// ========== Categories ==========
export async function getCategories() {
    return authFetch('/categories')
}

// ========== Components ==========
export async function getComponents(params = {}) {
    const query = new URLSearchParams()
    if (params.category) query.append('category', params.category)
    if (params.brand) query.append('brand', params.brand)
    if (params.search) query.append('search', params.search)
    if (params.sort) query.append('sort', params.sort)

    return authFetch(`/components?${query}`)
}

export async function getComponent(id) {
    return authFetch(`/components/${id}`)
}

// ========== Vendors ==========
export async function getVendors() {
    return authFetch('/vendors')
}

// ========== Builds ==========
export async function getBuilds() {
    return authFetch('/builds')
}

export async function saveBuild(build) {
    return authFetch('/builds', {
        method: 'POST',
        body: JSON.stringify(build)
    })
}

export async function deleteBuild(id) {
    return authFetch(`/builds/${id}`, { method: 'DELETE' })
}

// ========== Forum ==========
export async function getThreads(params = {}) {
    const query = new URLSearchParams()
    if (params.category) query.append('category', params.category)
    if (params.search) query.append('search', params.search)

    return authFetch(`/forum/threads?${query}`)
}

export async function getThread(id) {
    return authFetch(`/forum/threads/${id}`)
}

export async function createThread(thread) {
    return authFetch('/forum/threads', {
        method: 'POST',
        body: JSON.stringify(thread)
    })
}

export async function createReply(threadId, content) {
    return authFetch(`/forum/threads/${threadId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content })
    })
}

// ========== Helpers ==========
export function formatPrice(price) {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price)
}

export function getLowestPrice(component) {
    if (!component.prices?.length) return null
    return Math.min(...component.prices.map(p => parseFloat(p.price)))
}

export function getBestVendor(component) {
    if (!component.prices?.length) return null
    return component.prices.reduce((best, curr) =>
        parseFloat(curr.price) < parseFloat(best.price) ? curr : best
    )
}
