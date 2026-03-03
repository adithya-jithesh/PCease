// =====================================================
// PCease API Service — Centralized API layer
// Backend: FastAPI on Render | DB: Supabase
// =====================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ========== Core Fetch Helper ==========
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('pcease_token')
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token) headers.Authorization = `Bearer ${token}`

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
    const res = await fetch(url, { ...options, headers })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(err.detail || `Error ${res.status}`)
    }

    if (res.status === 204) return null
    return res.json()
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
        return request(`/components?${q}`)
    },

    getComponent: (id) => request(`/components/${id}`),

    // --- Vendors ---
    getVendors: () => request('/vendors'),

    // --- Builds ---
    getBuilds: () => request('/builds'),

    saveBuild: (build) =>
        request('/builds', { method: 'POST', body: JSON.stringify(build) }),

    deleteBuild: (id) =>
        request(`/builds/${id}`, { method: 'DELETE' }),

    // --- Shareable Builds ---
    shareBuild: (build) =>
        request('/builds/share', { method: 'POST', body: JSON.stringify(build) }),

    getSharedBuild: (shareId) =>
        request(`/builds/shared/${shareId}`),

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

    createThread: (thread) =>
        request('/forum/threads', { method: 'POST', body: JSON.stringify(thread) }),

    createReply: (threadId, content) =>
        request(`/forum/threads/${threadId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

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

// Category display names + icons
export const CATEGORIES = {
    cpu: { name: 'Processor', icon: '⚡', abbr: 'CPU' },
    gpu: { name: 'Graphics Card', icon: '🎮', abbr: 'GPU' },
    motherboard: { name: 'Motherboard', icon: '🔧', abbr: 'MB' },
    ram: { name: 'Memory', icon: '💾', abbr: 'RAM' },
    storage: { name: 'Storage', icon: '💿', abbr: 'SSD' },
    psu: { name: 'Power Supply', icon: '🔌', abbr: 'PSU' },
    pcCase: { name: 'Case', icon: '🖥️', abbr: 'CASE' },
    monitor: { name: 'Monitor', icon: '🖥️', abbr: 'MON' },
}

// Build slots config
export const BUILD_SLOTS = [
    { key: 'cpu', name: 'Processor', required: true, icon: '⚡' },
    { key: 'gpu', name: 'Graphics Card', required: false, icon: '🎮' },
    { key: 'motherboard', name: 'Motherboard', required: true, icon: '🔧' },
    { key: 'ram', name: 'Memory', required: true, icon: '💾' },
    { key: 'storage', name: 'Storage', required: true, icon: '💿' },
    { key: 'psu', name: 'Power Supply', required: true, icon: '🔌' },
    { key: 'pcCase', name: 'Case', required: false, icon: '🖥️' },
    { key: 'monitor', name: 'Monitor', required: false, icon: '🖥️' },
]
