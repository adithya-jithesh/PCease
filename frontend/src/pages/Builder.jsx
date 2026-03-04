import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, BUILD_SLOTS } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiLink, FiSave, FiX, FiPlus, FiZap, FiActivity, FiSearch, FiExternalLink, FiChevronLeft, FiShoppingCart, FiHelpCircle, FiArrowRight, FiFilter, FiSliders } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Builder.css'

// Key specs to surface per category
const SPEC_KEYS = {
    cpu: ['cores', 'boost_clock', 'socket'],
    gpu: ['memory', 'boost_clock'],
    motherboard: ['socket', 'chipset', 'form_factor'],
    ram: ['capacity', 'speed'],
    storage: ['capacity', 'type'],
    psu: ['wattage', 'efficiency'],
    case: ['form_factor'],
    cooler: ['type', 'fan_size'],
    monitor: ['resolution', 'refresh_rate', 'panel_type'],
    fans: ['size', 'quantity', 'airflow'],
    keyboard: ['type', 'switch', 'layout'],
    mouse: ['dpi', 'connection', 'weight'],
    mousepad: ['size', 'surface'],
    headset: ['driver', 'connection', 'microphone'],
}

// Core slots — ram2 and fans handled separately
const CORE_SLOTS = BUILD_SLOTS.filter(s => s.key !== 'ram2' && s.key !== 'fans')

// All accessory categories
const ACCESSORY_CATEGORIES = [
    { slug: 'fans', name: 'Case Fan' },
    { slug: 'keyboard', name: 'Keyboard' },
    { slug: 'mouse', name: 'Mouse' },
    { slug: 'mousepad', name: 'Mousepad' },
    { slug: 'headset', name: 'Headset' },
]

// Helper to get specs from component (handles both 'specs' and 'specifications')
const getSpecs = (comp) => comp?.specs || comp?.specifications || {}

const getInlineSpecs = (comp, maxCount = 3) => {
    const specs = getSpecs(comp)
    if (!specs || !Object.keys(specs).length) return []
    const catSlug = comp.category?.slug
    const keys = SPEC_KEYS[catSlug] || Object.keys(specs).slice(0, 3)
    return keys
        .filter(k => specs[k] !== undefined)
        .slice(0, maxCount)
        .map(k => `${k.replace(/_/g, ' ')}: ${specs[k]}`)
}

// Motherboard form factor compatibility with case
const FORM_FACTOR_COMPAT = {
    'ATX': ['ATX', 'Micro-ATX', 'Mini-ITX'],
    'Micro-ATX': ['Micro-ATX', 'Mini-ITX'],
    'Mini-ITX': ['Mini-ITX'],
    'Mid Tower': ['ATX', 'Micro-ATX', 'Mini-ITX'],
    'Full Tower': ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'],
    'Mini Tower': ['Micro-ATX', 'Mini-ITX'],
    'SFF': ['Mini-ITX'],
}

// Check compatibility between component and current build
const checkCompatibility = (comp, build, slotKey) => {
    const compSpecs = getSpecs(comp)
    const catSlug = comp.category?.slug || slotKey

    // Get specs from existing build components
    const cpuSpecs = getSpecs(build.cpu)
    const mbSpecs = getSpecs(build.motherboard)
    const caseSpecs = getSpecs(build.case)

    let compatible = true
    let reason = ''

    // CPU compatibility with motherboard
    if (catSlug === 'cpu' && build.motherboard) {
        if (compSpecs.socket && mbSpecs.socket && compSpecs.socket !== mbSpecs.socket) {
            compatible = false
            reason = `Socket ${compSpecs.socket} incompatible with motherboard (${mbSpecs.socket})`
        }
    }

    // Motherboard compatibility with CPU and RAM
    if (catSlug === 'motherboard') {
        if (build.cpu && compSpecs.socket && cpuSpecs.socket && compSpecs.socket !== cpuSpecs.socket) {
            compatible = false
            reason = `Socket ${compSpecs.socket} incompatible with CPU (${cpuSpecs.socket})`
        }
        if (build.ram) {
            const ramSpecs = getSpecs(build.ram)
            if (compSpecs.ram_type && ramSpecs.type && compSpecs.ram_type !== ramSpecs.type) {
                compatible = false
                reason = `${compSpecs.ram_type} incompatible with RAM (${ramSpecs.type})`
            }
        }
        if (build.case) {
            const mbForm = compSpecs.form_factor
            const caseSupport = caseSpecs.motherboard_support || caseSpecs.form_factor
            if (mbForm && caseSupport) {
                const supported = FORM_FACTOR_COMPAT[caseSupport] || [caseSupport]
                if (!supported.includes(mbForm)) {
                    compatible = false
                    reason = `${mbForm} doesn't fit in ${caseSupport} case`
                }
            }
        }
    }

    // RAM compatibility with motherboard
    if ((catSlug === 'ram' || slotKey === 'extra_ram') && build.motherboard) {
        if (compSpecs.type && mbSpecs.ram_type && compSpecs.type !== mbSpecs.ram_type) {
            compatible = false
            reason = `${compSpecs.type} incompatible with motherboard (${mbSpecs.ram_type})`
        }
    }

    // Case compatibility with motherboard
    if (catSlug === 'case' && build.motherboard) {
        const mbForm = mbSpecs.form_factor
        const caseSupport = compSpecs.motherboard_support || compSpecs.form_factor
        if (mbForm && caseSupport) {
            const supported = FORM_FACTOR_COMPAT[caseSupport] || [caseSupport]
            if (!supported.includes(mbForm)) {
                compatible = false
                reason = `Doesn't support ${mbForm} motherboard`
            }
        }
    }

    // Cooler compatibility with CPU socket
    if (catSlug === 'cooler' && build.cpu) {
        const coolerSockets = compSpecs.sockets || compSpecs.socket_support || ''
        const cpuSocket = cpuSpecs.socket
        if (cpuSocket && coolerSockets && !coolerSockets.includes(cpuSocket)) {
            compatible = false
            reason = `Doesn't support ${cpuSocket} socket`
        }
    }

    return { compatible, reason }
}

export default function Builder() {
    const { shareId } = useParams()
    const location = useLocation()
    const { user } = useAuth()

    // Core build state
    const [build, setBuild] = useState({})
    const [componentIds, setComponentIds] = useState({})

    // Extra RAM sticks (dynamic array)
    const [extraRam, setExtraRam] = useState([])

    // Accessories — dynamic per-category arrays { fans: [comp, comp], ... }
    const [accessories, setAccessories] = useState({})

    // Modal state
    const [activeSlot, setActiveSlot] = useState(null)
    const [slotComponents, setSlotComponents] = useState([])
    const [selectedComp, setSelectedComp] = useState(null) // step 2: retailer view
    const [loading, setLoading] = useState(false)
    const [searchFilter, setSearchFilter] = useState('')
    const [accessoryCatFilter, setAccessoryCatFilter] = useState('all') // for accessory modal filtering
    
    // Advanced filters
    const [brandFilter, setBrandFilter] = useState('')
    const [priceRange, setPriceRange] = useState({ min: '', max: '' })
    const [sortBy, setSortBy] = useState('price-low')
    const [showFilters, setShowFilters] = useState(false)

    // UI state
    const [saving, setSaving] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [buildName, setBuildName] = useState('My Build')
    const [wattage, setWattage] = useState(null)
    const [bottleneck, setBottleneck] = useState(null)
    const [sharedView, setSharedView] = useState(false)
    const [showGuide, setShowGuide] = useState(false)

    // Memoized: Merge all component IDs for save/share
    const allComponentIds = useMemo(() => ({
        ...componentIds,
        ...extraRam.reduce((acc, comp, i) => ({ ...acc, [`ram_extra_${i}`]: comp.id }), {}),
        ...Object.entries(accessories).reduce((acc, [cat, items]) => {
            items.forEach((comp, i) => { acc[`${cat}_${i}`] = comp.id })
            return acc
        }, {}),
    }), [componentIds, extraRam, accessories])

    // Memoized: All components flat for total price
    const allComponents = useMemo(() => [
        ...Object.values(build),
        ...extraRam,
        ...Object.values(accessories).flat(),
    ], [build, extraRam, accessories])

    const totalPrice = useMemo(() => 
        allComponents.reduce((s, c) => s + (getLowestPrice(c) || 0), 0),
        [allComponents]
    )

    useEffect(() => { if (shareId) loadSharedBuild(shareId) }, [shareId])

    // Load recommendation components from Advisor page
    useEffect(() => {
        const recommendation = location.state?.recommendation
        if (!recommendation?.components?.length) return
        
        const loadRecommendation = async () => {
            setLoading(true)
            setBuildName(recommendation.title || recommendation.name || 'AI Recommended Build')
            
            const newBuild = {}
            const newIds = {}
            
            // Map category names to slot keys
            const catToSlot = {
                'CPU': 'cpu',
                'GPU': 'gpu',
                'MOTHERBOARD': 'motherboard',
                'RAM': 'ram',
                'STORAGE': 'storage',
                'PSU': 'psu',
                'CASE': 'case',
                'COOLER': 'cooler',
            }
            
            for (const comp of recommendation.components) {
                const slotKey = catToSlot[comp.category?.toUpperCase()] || comp.category?.toLowerCase()
                if (!slotKey) continue
                
                // If we have component_id, fetch the full component
                if (comp.component_id) {
                    try {
                        const fullComp = await API.getComponent(comp.component_id)
                        if (fullComp) {
                            newBuild[slotKey] = fullComp
                            newIds[slotKey] = fullComp.id
                        }
                    } catch (e) {
                        // Fallback: use the recommendation data directly
                        newBuild[slotKey] = {
                            id: comp.component_id,
                            name: comp.name,
                            brand: comp.brand,
                            specs: comp.specs,
                            prices: [{ price: comp.price, vendor: { name: comp.vendor } }]
                        }
                        newIds[slotKey] = comp.component_id
                    }
                } else {
                    // No component_id - create a placeholder from recommendation
                    newBuild[slotKey] = {
                        name: comp.name || comp.suggestion,
                        brand: comp.brand || '',
                        specs: comp.specs || {},
                        prices: comp.price ? [{ price: comp.price, vendor: { name: comp.vendor || 'Estimated' } }] : []
                    }
                }
            }
            
            setBuild(newBuild)
            setComponentIds(newIds)
            setLoading(false)
        }
        
        loadRecommendation()
    }, [location.state])

    useEffect(() => {
        const ids = allComponentIds
        if (Object.keys(ids).length > 0) API.calculateWattage(ids).then(setWattage).catch(() => {})
    }, [JSON.stringify(allComponentIds)])

    useEffect(() => {
        if (componentIds.cpu && componentIds.gpu)
            API.checkBottleneck(componentIds.cpu, componentIds.gpu).then(setBottleneck).catch(() => {})
        else setBottleneck(null)
    }, [componentIds.cpu, componentIds.gpu])

    const loadSharedBuild = async (id) => {
        try {
            setLoading(true)
            const data = await API.getSharedBuild(id)
            setBuildName(data.name || 'Shared Build')
            setSharedView(true)
            if (data.components_detail) {
                const newBuild = {}, newIds = {}, newExtraRam = [], newAccessories = {}
                for (const [key, comp] of Object.entries(data.components_detail)) {
                    if (key.startsWith('ram_extra_')) {
                        newExtraRam.push(comp)
                    } else if (key.match(/^[a-z]+_\d+$/)) {
                        const cat = key.replace(/_\d+$/, '')
                        if (!newAccessories[cat]) newAccessories[cat] = []
                        newAccessories[cat].push(comp)
                    } else {
                        newBuild[key] = comp
                        newIds[key] = comp.id
                    }
                }
                setBuild(newBuild)
                setComponentIds(newIds)
                setExtraRam(newExtraRam)
                setAccessories(newAccessories)
            }
        } catch { toast.error('Failed to load shared build') }
        finally { setLoading(false) }
    }

    const openSlotModal = async (slotKey) => {
        setActiveSlot(slotKey)
        setSearchFilter('')
        setSelectedComp(null)
        setAccessoryCatFilter('all')
        setBrandFilter('')
        setPriceRange({ min: '', max: '' })
        setSortBy('price-low')
        setShowFilters(false)
        setLoading(true)

        // Determine the API category from slot key
        let categoryKey = slotKey
        if (slotKey === 'extra_ram') categoryKey = 'ram'
        else if (slotKey === 'accessories') {
            // Unified accessories modal - fetch all accessory categories
            try {
                const allAccessories = await Promise.all(
                    ACCESSORY_CATEGORIES.map(cat => API.getComponents({ category: cat.slug }))
                )
                // Flatten and tag with category
                const tagged = allAccessories.flatMap((items, i) => 
                    items.map(item => ({ ...item, _accessoryCat: ACCESSORY_CATEGORIES[i].slug }))
                )
                setSlotComponents(tagged)
            } catch { setSlotComponents([]) }
            finally { setLoading(false) }
            return
        }
        else if (slotKey.startsWith('accessory_')) categoryKey = slotKey.replace('accessory_', '')
        else {
            const slotDef = CORE_SLOTS.find(s => s.key === slotKey)
            categoryKey = slotDef?.category || slotKey
        }

        try { setSlotComponents(await API.getComponents({ category: categoryKey })) }
        catch { setSlotComponents([]) }
        finally { setLoading(false) }
    }

    // Step 1 → Step 2: pick a component to see its retailers
    const pickComponent = (comp) => setSelectedComp(comp)

    // Step 2 confirm: add component (optionally with a specific vendor)
    const confirmSelection = (comp, vendorPrice = null) => {
        const compWithVendor = vendorPrice
            ? { ...comp, selectedVendor: vendorPrice }
            : comp

        if (activeSlot === 'extra_ram') {
            setExtraRam(prev => [...prev, compWithVendor])
        } else if (activeSlot === 'accessories') {
            // Unified accessories mode - determine category from component
            const cat = comp._accessoryCat || comp.category?.slug || 'fans'
            setAccessories(prev => ({
                ...prev,
                [cat]: [...(prev[cat] || []), compWithVendor],
            }))
        } else if (activeSlot?.startsWith('accessory_')) {
            const cat = activeSlot.replace('accessory_', '')
            setAccessories(prev => ({
                ...prev,
                [cat]: [...(prev[cat] || []), compWithVendor],
            }))
        } else {
            setBuild(prev => ({ ...prev, [activeSlot]: compWithVendor }))
            setComponentIds(prev => ({ ...prev, [activeSlot]: compWithVendor.id }))
        }

        setActiveSlot(null)
        setSelectedComp(null)
        toast.success(`${comp.name} added`)
    }

    const removeComponent = (key) => {
        setBuild(prev => { const n = { ...prev }; delete n[key]; return n })
        setComponentIds(prev => { const n = { ...prev }; delete n[key]; return n })
    }

    const removeExtraRam = useCallback((index) => 
        setExtraRam(prev => prev.filter((_, i) => i !== index)), [])

    const removeAccessory = useCallback((cat, index) => {
        setAccessories(prev => ({
            ...prev,
            [cat]: prev[cat].filter((_, i) => i !== index),
        }))
    }, [])

    const handleSave = useCallback(async () => {
        if (!user) return toast.error('Please login to save')
        setSaving(true)
        try {
            await API.saveBuild({ name: buildName, components: allComponentIds })
            toast.success('Build saved!')
        } catch (e) { toast.error('Failed: ' + e.message) }
        finally { setSaving(false) }
    }, [user, buildName, allComponentIds])

    const handleShare = useCallback(async () => {
        if (Object.keys(allComponentIds).length === 0) return toast.error('Add components first')
        setSharing(true)
        try {
            const r = await API.shareBuild({ name: buildName, components: allComponentIds })
            await navigator.clipboard.writeText(`${window.location.origin}/builder/${r.share_id}`)
            toast.success('Share link copied!')
        } catch (e) { toast.error('Failed: ' + e.message) }
        finally { setSharing(false) }
    }, [buildName, allComponentIds])

    // Get unique brands from components
    const availableBrands = useMemo(() => {
        const brands = new Set(slotComponents.map(c => c.brand).filter(Boolean))
        return Array.from(brands).sort()
    }, [slotComponents])

    // Memoized filtered list (with accessory category filter)
    const filtered = useMemo(() => {
        let list = slotComponents
        
        // Apply accessory category filter for unified accessories modal
        if (activeSlot === 'accessories' && accessoryCatFilter !== 'all') {
            list = list.filter(c => c._accessoryCat === accessoryCatFilter || c.category?.slug === accessoryCatFilter)
        }
        
        // Apply search filter
        if (searchFilter) {
            list = list.filter(c => c.name.toLowerCase().includes(searchFilter.toLowerCase()))
        }
        
        // Apply brand filter
        if (brandFilter) {
            list = list.filter(c => c.brand === brandFilter)
        }
        
        // Apply price range filter
        if (priceRange.min || priceRange.max) {
            list = list.filter(c => {
                const price = getLowestPrice(c)
                if (!price) return false
                if (priceRange.min && price < parseFloat(priceRange.min)) return false
                if (priceRange.max && price > parseFloat(priceRange.max)) return false
                return true
            })
        }
        
        // Apply sorting
        list = [...list].sort((a, b) => {
            const priceA = getLowestPrice(a) || 0
            const priceB = getLowestPrice(b) || 0
            if (sortBy === 'price-low') return priceA - priceB
            if (sortBy === 'price-high') return priceB - priceA
            if (sortBy === 'name') return a.name.localeCompare(b.name)
            return 0
        })
        
        return list
    }, [slotComponents, searchFilter, activeSlot, accessoryCatFilter, brandFilter, priceRange, sortBy])

    const getModalTitle = useCallback(() => {
        if (activeSlot === 'extra_ram') return 'Add Extra RAM'
        if (activeSlot === 'accessories') return 'Add Accessory'
        if (activeSlot?.startsWith('accessory_')) {
            const catSlug = activeSlot.replace('accessory_', '')
            const def = ACCESSORY_CATEGORIES.find(a => a.slug === catSlug)
            return `Add ${def?.name || 'Accessory'}`
        }
        return `Select ${CORE_SLOTS.find(s => s.key === activeSlot)?.name || ''}`
    }, [activeSlot])

    return (
        <main className="page">
            <div className="container">
                <header className="bd-header">
                    <div>
                        <h1>{sharedView ? 'Shared Build' : 'PC Builder'}</h1>
                        <p className="bd-header__sub">
                            {sharedView
                                ? 'Viewing a shared build — modify and save your own.'
                                : 'Select components, compare retailer prices, and share.'}
                        </p>
                    </div>
                    <div className="bd-actions">
                        <button className="btn btn-secondary" onClick={() => setShowGuide(true)}>
                            <FiHelpCircle size={14} /> Guide Me
                        </button>
                        <input type="text" value={buildName} onChange={e => setBuildName(e.target.value)} placeholder="Build name" className="bd-name" />
                        <button className="btn" onClick={handleShare} disabled={sharing}>
                            <FiLink size={14} /> {sharing ? '...' : 'Share'}
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            <FiSave size={14} /> {saving ? '...' : 'Save'}
                        </button>
                    </div>
                </header>

                <div className="bd-layout">
                    {/* ── Slots ── */}
                    <section className="bd-slots">
                        {CORE_SLOTS.map(slot => {
                            const sel = build[slot.key]
                            const isRam = slot.key === 'ram'

                            return (
                                <div key={slot.key} className={`bd-slot-group${isRam ? ' bd-slot-group--ram' : ''}`}>
                                    <div className={`bd-slot${sel ? ' bd-slot--filled' : ''}`}>
                                        <div className="bd-slot__head">
                                            <span className="bd-slot__name">{slot.name}</span>
                                        </div>

                                        {sel ? (
                                            <div className="bd-slot__sel">
                                                <div className="bd-slot__info">
                                                    <strong>{sel.name}</strong>
                                                    <span className="bd-slot__meta">
                                                        {sel.brand} · {formatPrice(getLowestPrice(sel))}
                                                        {sel.selectedVendor && (
                                                            <> · <em>{sel.selectedVendor.vendor?.name}</em></>
                                                        )}
                                                    </span>
                                                    {getInlineSpecs(sel).length > 0 && (
                                                        <span className="bd-slot__specs">{getInlineSpecs(sel).join(' · ')}</span>
                                                    )}
                                                </div>
                                                <div className="bd-slot__btns">
                                                    <button className="btn btn-sm" onClick={() => openSlotModal(slot.key)}>Change</button>
                                                    <button className="btn btn-sm" onClick={() => removeComponent(slot.key)}><FiX size={14} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="bd-slot__add" onClick={() => openSlotModal(slot.key)}>
                                                <FiPlus size={14} /> Add {slot.name}
                                            </button>
                                        )}
                                    </div>

                                    {/* ── Extra RAM sticks — nested inside the RAM group ── */}
                                    {isRam && extraRam.map((ram, i) => (
                                        <div key={`extra_ram_${i}`} className="bd-slot bd-slot--filled bd-slot--extra">
                                            <div className="bd-slot__head">
                                                <span className="bd-slot__name">Extra RAM #{i + 1}</span>
                                            </div>
                                            <div className="bd-slot__sel">
                                                <div className="bd-slot__info">
                                                    <strong>{ram.name}</strong>
                                                    <span className="bd-slot__meta">{ram.brand} · {formatPrice(getLowestPrice(ram))}</span>
                                                </div>
                                                <div className="bd-slot__btns">
                                                    <button className="btn btn-sm" onClick={() => removeExtraRam(i)}><FiX size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {isRam && sel && (
                                        <button className="bd-slot__add-extra" onClick={() => openSlotModal('extra_ram')}>
                                            <FiPlus size={12} /> Add Another RAM Stick
                                        </button>
                                    )}
                                </div>
                            )
                        })}

                        {/* ── Accessories Section — unified with filter tabs ── */}
                        <div className="bd-accessories">
                            <h3 className="bd-accessories__title">Accessories</h3>
                            <p className="bd-accessories__sub">Add as many as you need — a new slot appears each time.</p>

                            {/* Show all added accessories across all categories */}
                            <div className="bd-accessory-list">
                                {ACCESSORY_CATEGORIES.flatMap(cat => {
                                    const items = accessories[cat.slug] || []
                                    return items.map((comp, i) => (
                                        <div key={`${cat.slug}_${i}`} className="bd-slot bd-slot--filled bd-slot--accessory">
                                            <div className="bd-slot__head">
                                                <span className="bd-slot__name">
                                                    {cat.name} #{i + 1}
                                                </span>
                                            </div>
                                            <div className="bd-slot__sel">
                                                <div className="bd-slot__info">
                                                    <strong>{comp.name}</strong>
                                                    <span className="bd-slot__meta">{comp.brand} · {formatPrice(getLowestPrice(comp))}</span>
                                                </div>
                                                <div className="bd-slot__btns">
                                                    <button className="btn btn-sm" onClick={() => removeAccessory(cat.slug, i)}>
                                                        <FiX size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                })}
                            </div>

                            {/* Single "Add" button that opens unified modal */}
                            <button className="bd-slot__add" onClick={() => openSlotModal('accessories')}>
                                <FiPlus size={14} /> Add
                            </button>
                        </div>
                    </section>

                    {/* ── Sidebar ── */}
                    <aside className="bd-sidebar">
                        <div className="bd-summary">
                            <h3>Build Summary</h3>
                            <ul className="bd-summary__list">
                                {CORE_SLOTS.map(slot => (
                                    <li key={slot.key} className={build[slot.key] ? 'has' : ''}>
                                        <span>{slot.name}</span>
                                        <span>{build[slot.key] ? formatPrice(getLowestPrice(build[slot.key])) : '—'}</span>
                                    </li>
                                ))}
                                {extraRam.map((ram, i) => (
                                    <li key={`er_${i}`} className="has">
                                        <span>Extra RAM #{i + 1}</span>
                                        <span>{formatPrice(getLowestPrice(ram))}</span>
                                    </li>
                                ))}
                                {Object.entries(accessories).flatMap(([cat, items]) =>
                                    items.map((comp, i) => (
                                        <li key={`${cat}_${i}`} className="has">
                                            <span>{ACCESSORY_DEFS.find(d => d.category === cat)?.name} #{i + 1}</span>
                                            <span>{formatPrice(getLowestPrice(comp))}</span>
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="bd-summary__divider" />
                            <div className="bd-summary__total">
                                <span>Total</span>
                                <span className="bd-summary__price">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        {wattage && (
                            <div className="bd-info-card">
                                <h3><FiZap size={14} /> Power Estimate</h3>
                                <div className="bd-info__row">
                                    <span>Estimated TDP</span>
                                    <span className="bd-info__val">{wattage.total_tdp}W</span>
                                </div>
                                <div className="bd-info__row">
                                    <span>Recommended PSU</span>
                                    <span className="bd-info__val">{wattage.recommended_psu}W</span>
                                </div>
                            </div>
                        )}

                        {bottleneck && (
                            <div className={`bd-info-card bd-bn--${bottleneck.severity}`}>
                                <h3><FiActivity size={14} /> Bottleneck Analysis</h3>
                                <p className="bd-bn__msg">{bottleneck.message}</p>
                                <div className="bd-bn__tiers">
                                    <div><span>CPU</span><span className="bd-bn__bar">{'█'.repeat(bottleneck.cpu.tier)}{'░'.repeat(5 - bottleneck.cpu.tier)}</span></div>
                                    <div><span>GPU</span><span className="bd-bn__bar">{'█'.repeat(bottleneck.gpu.tier)}{'░'.repeat(5 - bottleneck.gpu.tier)}</span></div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>

                {/* ── Two-Step Component Selection Modal ── */}
                {activeSlot && (
                    <div className="modal-overlay" onClick={() => { setActiveSlot(null); setSelectedComp(null) }}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                {selectedComp ? (
                                    <>
                                        <button className="bd-modal-back" onClick={() => setSelectedComp(null)}>
                                            <FiChevronLeft size={18} />
                                        </button>
                                        <h2>{selectedComp.name}</h2>
                                    </>
                                ) : (
                                    <h2>{getModalTitle()}</h2>
                                )}
                                <button className="modal-close" onClick={() => { setActiveSlot(null); setSelectedComp(null) }}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body">
                                {selectedComp ? (
                                    /* ── Step 2: Retailer Selection ── */
                                    <div className="bd-retailer-view">
                                        <div className="bd-retailer-comp">
                                            <span className="bd-retailer-comp__brand">{selectedComp.brand}</span>
                                            <h3 className="bd-retailer-comp__name">{selectedComp.name}</h3>
                                            {getInlineSpecs(selectedComp, 6).length > 0 && (
                                                <div className="bd-retailer-comp__specs">
                                                    {getInlineSpecs(selectedComp, 6).map((spec, i) => (
                                                        <span key={i} className="bd-spec-chip">{spec}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="bd-retailer-heading">
                                            <FiShoppingCart size={14} />
                                            Choose a Retailer ({(selectedComp.prices || []).length} available)
                                        </h4>

                                        <div className="bd-retailer-list">
                                            {[...(selectedComp.prices || [])]
                                                .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                                                .map((p, i) => {
                                                    const vendorUrl = p.url || p.vendor?.website_url
                                                    return (
                                                        <div key={i} className={`bd-retailer-row${i === 0 ? ' bd-retailer-row--best' : ''}`}>
                                                            <div className="bd-retailer-row__info">
                                                                <span className="bd-retailer-row__name">
                                                                    {vendorUrl ? (
                                                                        <a href={vendorUrl} target="_blank" rel="noreferrer" className="bd-retailer-link">
                                                                            {p.vendor?.name || 'Store'}
                                                                            <FiExternalLink size={11} />
                                                                        </a>
                                                                    ) : (
                                                                        p.vendor?.name || 'Store'
                                                                    )}
                                                                    {i === 0 && <span className="bd-retailer-badge">Best Price</span>}
                                                                </span>
                                                                <span className="bd-retailer-row__price">{formatPrice(p.price)}</span>
                                                            </div>
                                                            <div className="bd-retailer-row__actions">
                                                                <button className="btn btn-sm btn-primary" onClick={() => confirmSelection(selectedComp, p)}>
                                                                    Select
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>

                                        <button className="btn bd-retailer-quick" onClick={() => confirmSelection(selectedComp)}>
                                            Add with Best Price ({formatPrice(getLowestPrice(selectedComp))})
                                        </button>
                                    </div>
                                ) : (
                                    /* ── Step 1: Component List ── */
                                    <>
                                        <div className="bd-modal-search-row">
                                            <div className="bd-modal-search">
                                                <FiSearch className="bd-modal-search__icon" />
                                                <input
                                                    type="search"
                                                    placeholder="Search components..."
                                                    value={searchFilter}
                                                    onChange={e => setSearchFilter(e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                className={`btn btn-icon bd-filter-toggle${showFilters ? ' active' : ''}`}
                                                onClick={() => setShowFilters(!showFilters)}
                                                title="Toggle filters"
                                            >
                                                <FiSliders size={16} />
                                            </button>
                                        </div>

                                        {/* Advanced Filters Panel */}
                                        {showFilters && (
                                            <div className="bd-filters-panel">
                                                <div className="bd-filters-row">
                                                    <div className="bd-filter-group">
                                                        <label>Brand</label>
                                                        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                                                            <option value="">All Brands</option>
                                                            {availableBrands.map(b => (
                                                                <option key={b} value={b}>{b}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="bd-filter-group">
                                                        <label>Sort By</label>
                                                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                                            <option value="price-low">Price: Low to High</option>
                                                            <option value="price-high">Price: High to Low</option>
                                                            <option value="name">Name: A-Z</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="bd-filters-row">
                                                    <div className="bd-filter-group bd-filter-group--price">
                                                        <label>Price Range</label>
                                                        <div className="bd-price-inputs">
                                                            <input
                                                                type="number"
                                                                placeholder="Min"
                                                                value={priceRange.min}
                                                                onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
                                                            />
                                                            <span>to</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Max"
                                                                value={priceRange.max}
                                                                onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm bd-clear-filters"
                                                        onClick={() => {
                                                            setBrandFilter('')
                                                            setPriceRange({ min: '', max: '' })
                                                            setSortBy('price-low')
                                                        }}
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Category filter tabs for accessories modal */}
                                        {activeSlot === 'accessories' && (
                                            <div className="bd-acc-filter">
                                                <button 
                                                    className={`bd-acc-filter__tab${accessoryCatFilter === 'all' ? ' active' : ''}`}
                                                    onClick={() => setAccessoryCatFilter('all')}
                                                >
                                                    All
                                                </button>
                                                {ACCESSORY_CATEGORIES.map(cat => (
                                                    <button 
                                                        key={cat.slug}
                                                        className={`bd-acc-filter__tab${accessoryCatFilter === cat.slug ? ' active' : ''}`}
                                                        onClick={() => setAccessoryCatFilter(cat.slug)}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {loading ? (
                                            <div className="bd-modal-loading">
                                                <div className="bd-spinner" />
                                                <p>Loading components...</p>
                                            </div>
                                        ) : filtered.length === 0 ? (
                                            <p className="text-muted" style={{ textAlign: 'center', padding: '32px 0' }}>
                                                No components found
                                            </p>
                                        ) : (
                                            <div className="bd-comp-list">
                                                {filtered.map(comp => {
                                                    const lowestPrice = getLowestPrice(comp)
                                                    const vendorCount = (comp.prices || []).length
                                                    const specs = getInlineSpecs(comp, 4)
                                                    const { compatible, reason } = checkCompatibility(comp, build, activeSlot)

                                                    return (
                                                        <button 
                                                            key={comp.id} 
                                                            className={`bd-comp-opt${!compatible ? ' bd-comp-opt--incompatible' : ''}`}
                                                            onClick={() => compatible && pickComponent(comp)}
                                                            disabled={!compatible}
                                                            title={!compatible ? reason : ''}
                                                        >
                                                            <div className="bd-comp-opt__main">
                                                                <div className="bd-comp-opt__info">
                                                                    <strong>{comp.name}</strong>
                                                                    <span className="bd-comp-opt__brand">{comp.brand}</span>
                                                                    {specs.length > 0 && (
                                                                        <span className="bd-comp-opt__specs">{specs.join(' · ')}</span>
                                                                    )}
                                                                    {!compatible && (
                                                                        <span className="bd-comp-opt__incompat">{reason}</span>
                                                                    )}
                                                                </div>
                                                                <div className="bd-comp-opt__right">
                                                                    <span className="bd-comp-opt__lowest">{formatPrice(lowestPrice)}</span>
                                                                    <span className="bd-comp-opt__vendor-count">
                                                                        {vendorCount} retailer{vendorCount !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Guide Me Modal */}
                {showGuide && (
                    <div className="modal-overlay" onClick={() => setShowGuide(false)}>
                        <div className="modal bd-guide-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>How to Build Your PC</h2>
                                <button className="modal-close" onClick={() => setShowGuide(false)}><FiX size={18} /></button>
                            </div>
                            <div className="modal-body bd-guide-steps">
                                <div className="bd-guide-step">
                                    <span className="bd-guide-step__num">1</span>
                                    <div className="bd-guide-step__content">
                                        <h4>Choose Your Components</h4>
                                        <p>Click "Add" on any slot to browse and select components. Start with CPU or GPU based on your priorities (gaming vs productivity).</p>
                                    </div>
                                </div>
                                <div className="bd-guide-step">
                                    <span className="bd-guide-step__num">2</span>
                                    <div className="bd-guide-step__content">
                                        <h4>Check Compatibility</h4>
                                        <p>The system automatically dims incompatible parts (e.g., wrong CPU socket for motherboard). Greyed-out items won't fit your build.</p>
                                    </div>
                                </div>
                                <div className="bd-guide-step">
                                    <span className="bd-guide-step__num">3</span>
                                    <div className="bd-guide-step__content">
                                        <h4>Compare Prices</h4>
                                        <p>After selecting a component, choose your preferred retailer. We show prices from 9 Indian vendors to find you the best deal.</p>
                                    </div>
                                </div>
                                <div className="bd-guide-step">
                                    <span className="bd-guide-step__num">4</span>
                                    <div className="bd-guide-step__content">
                                        <h4>Add Accessories</h4>
                                        <p>Expand the Accessories section to add peripherals like keyboard, mouse, headset, or extra case fans.</p>
                                    </div>
                                </div>
                                <div className="bd-guide-step">
                                    <span className="bd-guide-step__num">5</span>
                                    <div className="bd-guide-step__content">
                                        <h4>Save & Share</h4>
                                        <p>Name your build, then Save to your account or Share a link with friends. The summary panel shows total cost and power requirements.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => setShowGuide(false)}>
                                    Start Building <FiArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
