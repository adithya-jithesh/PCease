import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, BUILD_SLOTS } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiLink, FiSave, FiX, FiPlus, FiZap, FiActivity, FiSearch, FiExternalLink, FiChevronLeft, FiShoppingCart } from 'react-icons/fi'
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
}

// Core slots — ram2 and fans handled separately
const CORE_SLOTS = BUILD_SLOTS.filter(s => s.key !== 'ram2' && s.key !== 'fans')

// Accessory categories — infinite add
const ACCESSORY_DEFS = [
    { category: 'fans', name: 'Case Fan' },
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

    // UI state
    const [saving, setSaving] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [buildName, setBuildName] = useState('My Build')
    const [wattage, setWattage] = useState(null)
    const [bottleneck, setBottleneck] = useState(null)
    const [sharedView, setSharedView] = useState(false)

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
        setLoading(true)

        // Determine the API category from slot key
        let categoryKey = slotKey
        if (slotKey === 'extra_ram') categoryKey = 'ram'
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

    // Memoized filtered list
    const filtered = useMemo(() => 
        slotComponents.filter(c =>
            !searchFilter || c.name.toLowerCase().includes(searchFilter.toLowerCase())
        ), [slotComponents, searchFilter])

    const getModalTitle = useCallback(() => {
        if (activeSlot === 'extra_ram') return 'Add Extra RAM'
        if (activeSlot?.startsWith('accessory_')) {
            const def = ACCESSORY_DEFS.find(a => a.category === activeSlot.replace('accessory_', ''))
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
                                            {slot.required && <span className="bd-slot__req">Required</span>}
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

                        {/* ── Accessories Section — infinite add ── */}
                        <div className="bd-accessories">
                            <h3 className="bd-accessories__title">Accessories</h3>
                            <p className="bd-accessories__sub">Add as many as you need — a new slot appears each time.</p>

                            {ACCESSORY_DEFS.map(def => {
                                const items = accessories[def.category] || []
                                return (
                                    <div key={def.category} className="bd-accessory-group">
                                        {items.map((comp, i) => (
                                            <div key={`${def.category}_${i}`} className="bd-slot bd-slot--filled bd-slot--accessory">
                                                <div className="bd-slot__head">
                                                    <span className="bd-slot__name">{def.name} #{i + 1}</span>
                                                </div>
                                                <div className="bd-slot__sel">
                                                    <div className="bd-slot__info">
                                                        <strong>{comp.name}</strong>
                                                        <span className="bd-slot__meta">{comp.brand} · {formatPrice(getLowestPrice(comp))}</span>
                                                    </div>
                                                    <div className="bd-slot__btns">
                                                        <button className="btn btn-sm" onClick={() => removeAccessory(def.category, i)}>
                                                            <FiX size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button className="bd-slot__add" onClick={() => openSlotModal(`accessory_${def.category}`)}>
                                            <FiPlus size={14} /> Add {def.name}
                                        </button>
                                    </div>
                                )
                            })}
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
                                                .map((p, i) => (
                                                    <div key={i} className={`bd-retailer-row${i === 0 ? ' bd-retailer-row--best' : ''}`}>
                                                        <div className="bd-retailer-row__info">
                                                            <span className="bd-retailer-row__name">
                                                                {p.vendor?.name || 'Store'}
                                                                {i === 0 && <span className="bd-retailer-badge">Best Price</span>}
                                                            </span>
                                                            <span className="bd-retailer-row__price">{formatPrice(p.price)}</span>
                                                        </div>
                                                        <div className="bd-retailer-row__actions">
                                                            {p.url && (
                                                                <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-sm bd-retailer-visit">
                                                                    <FiExternalLink size={12} /> Visit Site
                                                                </a>
                                                            )}
                                                            <button className="btn btn-sm btn-primary" onClick={() => confirmSelection(selectedComp, p)}>
                                                                Select
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>

                                        <button className="btn bd-retailer-quick" onClick={() => confirmSelection(selectedComp)}>
                                            Add with Best Price ({formatPrice(getLowestPrice(selectedComp))})
                                        </button>
                                    </div>
                                ) : (
                                    /* ── Step 1: Component List ── */
                                    <>
                                        <div className="bd-modal-search">
                                            <FiSearch className="bd-modal-search__icon" />
                                            <input
                                                type="search"
                                                placeholder="Search components..."
                                                value={searchFilter}
                                                onChange={e => setSearchFilter(e.target.value)}
                                            />
                                        </div>

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
            </div>
        </main>
    )
}
