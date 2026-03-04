/**
 * PCease API Service — Optimized with caching and request deduplication
 * Backend: FastAPI on Render | DB: Supabase
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ========== Request Cache ==========
const cache = new Map()
const CACHE_TTL = 60_000 // 1 minute
const pendingRequests = new Map()

function getCacheKey(endpoint, options = {}) {
    return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`
}

function getCached(key) {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
        cache.delete(key)
        return null
    }
    return entry.data
}

function setCache(key, data, ttl = CACHE_TTL) {
    cache.set(key, { data, expires: Date.now() + ttl })
}

// ========== Core Fetch ==========
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('pcease_token')
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token) headers.Authorization = `Bearer ${token}`

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
    const cacheKey = getCacheKey(endpoint, options)

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
        const cached = getCached(cacheKey)
        if (cached) return cached

        // Deduplicate in-flight requests
        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey)
        }
    }

    const fetchPromise = (async () => {
        const res = await fetch(url, { ...options, headers })

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Request failed' }))
            throw new Error(err.detail || `Error ${res.status}`)
        }

        if (res.status === 204) return null
        const data = await res.json()

        // Cache GET responses
        if (!options.method || options.method === 'GET') {
            setCache(cacheKey, data)
        }

        return data
    })()

    // Track pending request for deduplication
    if (!options.method || options.method === 'GET') {
        pendingRequests.set(cacheKey, fetchPromise)
        fetchPromise.finally(() => pendingRequests.delete(cacheKey))
    }

    return fetchPromise
}

// ========== Cache Invalidation ==========
export function invalidateCache(pattern = '') {
    if (!pattern) {
        cache.clear()
        return
    }
    for (const key of cache.keys()) {
        if (key.includes(pattern)) cache.delete(key)
    }
}

// ========== API Methods ==========
export const API = {
    // --- Auth ---
    login: (email, password) => {
        const form = new URLSearchParams()
        form.append('username', email)
        form.append('password', password)
        return request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
        })
    },

    register: (email, username, password) =>
        request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, username, password }),
        }),

    getMe: (token) =>
        request('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),

    // --- Stats ---
    getStats: () => request('/stats'),

    // --- Categories ---
    getCategories: () => request('/categories'),

    // --- Components ---
    getComponents: (params = {}) => {
        const q = new URLSearchParams()
        if (params.category) q.append('category', params.category)
        if (params.brand) q.append('brand', params.brand)
        if (params.search) q.append('search', params.search)
        if (params.sort) q.append('sort', params.sort)
        q.append('limit', params.limit || '500')
        return request(`/components?${q}`)
    },

    getComponent: (id) => request(`/components/${id}`),

    // --- Vendors ---
    getVendors: () => request('/vendors'),

    // --- Builds ---
    getBuilds: () => request('/builds'),

    saveBuild: (build) => {
        invalidateCache('/builds')
        return request('/builds', { method: 'POST', body: JSON.stringify(build) })
    },

    deleteBuild: (id) => {
        invalidateCache('/builds')
        return request(`/builds/${id}`, { method: 'DELETE' })
    },

    // --- Shareable Builds ---
    shareBuild: (build) =>
        request('/builds/share', { method: 'POST', body: JSON.stringify(build) }),

    getSharedBuild: (shareId) => request(`/builds/shared/${shareId}`),

    // --- Compare ---
    compareComponents: (ids) =>
        request('/compare', { method: 'POST', body: JSON.stringify({ ids }) }),

    // --- Forum ---
    getThreads: (params = {}) => {
        const q = new URLSearchParams()
        if (params.category) q.append('category', params.category)
        if (params.search) q.append('search', params.search)
        return request(`/forum/threads?${q}`)
    },

    getThread: (id) => request(`/forum/threads/${id}`),

    createThread: (thread) => {
        invalidateCache('/forum/threads')
        return request('/forum/threads', { method: 'POST', body: JSON.stringify(thread) })
    },

    createReply: (threadId, content) => {
        invalidateCache(`/forum/threads/${threadId}`)
        return request(`/forum/threads/${threadId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        })
    },

    voteThread: (threadId, vote) =>
        request(`/forum/threads/${threadId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        }),

    voteReply: (replyId, vote) =>
        request(`/forum/replies/${replyId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        }),

    // --- AI Advisor ---
    getTemplates: () => request('/advisor/templates'),
    getTemplate: (id) => request(`/advisor/templates/${id}`),

    getRecommendation: (budget, useCase, preferences = '') =>
        request('/advisor/recommend', {
            method: 'POST',
            body: JSON.stringify({ budget, use_case: useCase, preferences }),
        }),

    askAI: (question) =>
        request('/advisor/ask', { method: 'POST', body: JSON.stringify({ question }) }),

    // --- Wattage Calculator ---
    calculateWattage: (components) =>
        request('/advisor/wattage', {
            method: 'POST',
            body: JSON.stringify({ components }),
        }),

    // --- Bottleneck ---
    checkBottleneck: (cpuId, gpuId) =>
        request('/advisor/bottleneck', {
            method: 'POST',
            body: JSON.stringify({ cpu_id: cpuId, gpu_id: gpuId }),
        }),
}

// ========== Utility Helpers ==========
export function formatPrice(price) {
    if (!price && price !== 0) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price)
}

export function getLowestPrice(component) {
    if (!component?.prices?.length) return null
    return Math.min(...component.prices.map((p) => parseFloat(p.price)))
}

export function getHighestPrice(component) {
    if (!component?.prices?.length) return null
    return Math.max(...component.prices.map((p) => parseFloat(p.price)))
}

export function getBestVendor(component) {
    if (!component?.prices?.length) return null
    return component.prices.reduce((best, curr) =>
        parseFloat(curr.price) < parseFloat(best.price) ? curr : best
    )
}

export function getSavings(component) {
    const low = getLowestPrice(component)
    const high = getHighestPrice(component)
    if (!low || !high || low === high) return 0
    return high - low
}

export function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
}

// Category display names (keys must match DB slugs)
export const CATEGORIES = {
    cpu: { name: 'Processor', abbr: 'CPU' },
    gpu: { name: 'Graphics Card', abbr: 'GPU' },
    motherboard: { name: 'Motherboard', abbr: 'MB' },
    ram: { name: 'Memory', abbr: 'RAM' },
    storage: { name: 'Storage', abbr: 'SSD' },
    psu: { name: 'Power Supply', abbr: 'PSU' },
    case: { name: 'Case', abbr: 'CASE' },
    cooler: { name: 'CPU Cooler', abbr: 'COOL' },
    monitor: { name: 'Monitor', abbr: 'MON' },
    fans: { name: 'Case Fans', abbr: 'FAN' },
}

// Build slots config
export const BUILD_SLOTS = [
    { key: 'cpu', name: 'Processor', required: true },
    { key: 'gpu', name: 'Graphics Card', required: false },
    { key: 'motherboard', name: 'Motherboard', required: true },
    { key: 'ram', name: 'Memory', required: true },
    { key: 'ram2', name: 'Extra RAM (optional)', required: false, category: 'ram' },
    { key: 'storage', name: 'Storage', required: true },
    { key: 'psu', name: 'Power Supply', required: true },
    { key: 'case', name: 'Case', required: false },
    { key: 'cooler', name: 'CPU Cooler', required: false },
    { key: 'monitor', name: 'Monitor', required: false },
    { key: 'fans', name: 'Case Fans', required: false },
]
