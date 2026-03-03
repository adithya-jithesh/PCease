import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, BUILD_SLOTS, CATEGORIES } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Builder.css'

export default function Builder() {
    const { shareId } = useParams()
    const { user } = useAuth()
    const [build, setBuild] = useState({})         // { slotKey: componentObject }
    const [componentIds, setComponentIds] = useState({})  // { slotKey: id }
    const [activeSlot, setActiveSlot] = useState(null)
    const [slotComponents, setSlotComponents] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [buildName, setBuildName] = useState('My Build')
    const [searchFilter, setSearchFilter] = useState('')
    const [wattage, setWattage] = useState(null)
    const [bottleneck, setBottleneck] = useState(null)
    const [sharedView, setSharedView] = useState(false)

    // Load shared build if shareId present
    useEffect(() => {
        if (shareId) {
            loadSharedBuild(shareId)
        }
    }, [shareId])

    // Auto-calculate wattage when build changes
    useEffect(() => {
        if (Object.keys(componentIds).length > 0) {
            API.calculateWattage(componentIds).then(setWattage).catch(() => {})
        }
    }, [componentIds])

    // Auto-check bottleneck when CPU and GPU selected
    useEffect(() => {
        if (componentIds.cpu && componentIds.gpu) {
            API.checkBottleneck(componentIds.cpu, componentIds.gpu).then(setBottleneck).catch(() => {})
        } else {
            setBottleneck(null)
        }
    }, [componentIds.cpu, componentIds.gpu])

    const loadSharedBuild = async (id) => {
        try {
            setLoading(true)
            const data = await API.getSharedBuild(id)
            setBuildName(data.name || 'Shared Build')
            setSharedView(true)

            if (data.components_detail) {
                const newBuild = {}
                const newIds = {}
                for (const [cat, comp] of Object.entries(data.components_detail)) {
                    newBuild[cat] = comp
                    newIds[cat] = comp.id
                }
                setBuild(newBuild)
                setComponentIds(newIds)
            }
        } catch {
            toast.error('Failed to load shared build')
        } finally {
            setLoading(false)
        }
    }

    const openSlotModal = async (slotKey) => {
        setActiveSlot(slotKey)
        setSearchFilter('')
        setLoading(true)
        try {
            const items = await API.getComponents({ category: slotKey })
            setSlotComponents(items)
        } catch {
            setSlotComponents([])
        } finally {
            setLoading(false)
        }
    }

    const selectComponent = (component) => {
        setBuild(prev => ({ ...prev, [activeSlot]: component }))
        setComponentIds(prev => ({ ...prev, [activeSlot]: component.id }))
        setActiveSlot(null)
        toast.success(`${component.name} added`)
    }

    const removeComponent = (slotKey) => {
        setBuild(prev => { const n = { ...prev }; delete n[slotKey]; return n })
        setComponentIds(prev => { const n = { ...prev }; delete n[slotKey]; return n })
    }

    const totalPrice = Object.values(build).reduce((sum, comp) => sum + (getLowestPrice(comp) || 0), 0)

    const handleSave = async () => {
        if (!user) return toast.error('Please login to save your build')
        setSaving(true)
        try {
            await API.saveBuild({ name: buildName, components: componentIds })
            toast.success('Build saved to your account!')
        } catch (e) {
            toast.error('Failed to save: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleShare = async () => {
        if (Object.keys(componentIds).length === 0) return toast.error('Add components first')
        setSharing(true)
        try {
            const result = await API.shareBuild({ name: buildName, components: componentIds })
            const url = `${window.location.origin}/builder/${result.share_id}`
            await navigator.clipboard.writeText(url)
            toast.success('Share link copied to clipboard!')
        } catch (e) {
            toast.error('Failed to share: ' + e.message)
        } finally {
            setSharing(false)
        }
    }

    const filteredComponents = slotComponents.filter(c =>
        !searchFilter || c.name.toLowerCase().includes(searchFilter.toLowerCase())
    )

    return (
        <main className="page-content">
            <div className="container">
                <header className="builder-header">
                    <div>
                        <h1>{sharedView ? '📎 Shared Build' : '🔧 PC Builder'}</h1>
                        <p>
                            {sharedView
                                ? 'Viewing a shared build. You can modify it and save your own version.'
                                : 'Select components, check compatibility, and share your build.'
                            }
                        </p>
                    </div>
                    <div className="builder-actions">
                        <input
                            type="text"
                            value={buildName}
                            onChange={e => setBuildName(e.target.value)}
                            placeholder="Build name"
                            className="build-name-input"
                        />
                        <button className="btn" onClick={handleShare} disabled={sharing}>
                            {sharing ? 'Sharing...' : '🔗 Share'}
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : '💾 Save'}
                        </button>
                    </div>
                </header>

                <div className="builder-layout">
                    {/* Component Slots */}
                    <section className="slots-list">
                        {BUILD_SLOTS.map(slot => {
                            const selected = build[slot.key]
                            return (
                                <div key={slot.key} className={`slot-card card ${selected ? 'filled' : ''}`}>
                                    <div className="slot-header">
                                        <div className="slot-left">
                                            <span className="slot-icon">{slot.icon}</span>
                                            <span className="slot-name">{slot.name}</span>
                                        </div>
                                        {slot.required && <span className="required-badge">Required</span>}
                                    </div>
                                    {selected ? (
                                        <div className="slot-selected">
                                            <div className="selected-info">
                                                <strong>{selected.name}</strong>
                                                <div className="selected-meta">
                                                    <span className="selected-brand">{selected.brand}</span>
                                                    <span className="selected-price">{formatPrice(getLowestPrice(selected))}</span>
                                                </div>
                                                {selected.prices?.length > 1 && (
                                                    <span className="vendor-count">
                                                        {selected.prices.length} vendors
                                                    </span>
                                                )}
                                            </div>
                                            <div className="slot-btns">
                                                <button className="btn btn-sm" onClick={() => openSlotModal(slot.key)}>Change</button>
                                                <button className="btn btn-sm" onClick={() => removeComponent(slot.key)}>✕</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="add-btn" onClick={() => openSlotModal(slot.key)}>
                                            + Add {slot.name}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </section>

                    {/* Summary Sidebar */}
                    <aside className="build-sidebar">
                        {/* Build Summary */}
                        <div className="build-summary card">
                            <h3>Build Summary</h3>
                            <ul className="summary-list">
                                {BUILD_SLOTS.map(slot => (
                                    <li key={slot.key} className={build[slot.key] ? 'has-value' : ''}>
                                        <span>{slot.icon} {slot.name}</span>
                                        <span>{build[slot.key]
                                            ? formatPrice(getLowestPrice(build[slot.key]))
                                            : '—'
                                        }</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="summary-divider" />
                            <div className="total-price">
                                <span>Estimated Total</span>
                                <span className="price">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        {/* Wattage Calculator */}
                        {wattage && (
                            <div className="wattage-card card">
                                <h3>⚡ Power Calculator</h3>
                                <div className="wattage-info">
                                    <div className="wattage-row">
                                        <span>Estimated TDP</span>
                                        <span className="wattage-value">{wattage.total_tdp}W</span>
                                    </div>
                                    <div className="wattage-row recommended">
                                        <span>Recommended PSU</span>
                                        <span className="wattage-value">{wattage.recommended_psu}W</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottleneck Check */}
                        {bottleneck && (
                            <div className={`bottleneck-card card bottleneck-${bottleneck.severity}`}>
                                <h3>📊 Bottleneck Analysis</h3>
                                <p className="bottleneck-msg">{bottleneck.message}</p>
                                <div className="bottleneck-tiers">
                                    <div className="tier-item">
                                        <span>CPU Tier</span>
                                        <span className="tier-bar">
                                            {'█'.repeat(bottleneck.cpu.tier)}{'░'.repeat(5 - bottleneck.cpu.tier)}
                                        </span>
                                    </div>
                                    <div className="tier-item">
                                        <span>GPU Tier</span>
                                        <span className="tier-bar">
                                            {'█'.repeat(bottleneck.gpu.tier)}{'░'.repeat(5 - bottleneck.gpu.tier)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>

                {/* Component Selection Modal */}
                {activeSlot && (
                    <div className="modal-overlay" onClick={() => setActiveSlot(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Select {BUILD_SLOTS.find(s => s.key === activeSlot)?.name}</h2>
                                <button className="modal-close" onClick={() => setActiveSlot(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="search"
                                    placeholder="Filter components..."
                                    value={searchFilter}
                                    onChange={e => setSearchFilter(e.target.value)}
                                    className="modal-search"
                                />
                                {loading ? (
                                    <div className="loading">Loading components...</div>
                                ) : filteredComponents.length === 0 ? (
                                    <p className="muted">No components found</p>
                                ) : (
                                    <div className="component-list">
                                        {filteredComponents.map(comp => (
                                            <button
                                                key={comp.id}
                                                className="component-option"
                                                onClick={() => selectComponent(comp)}
                                            >
                                                <div className="comp-info">
                                                    <strong>{comp.name}</strong>
                                                    <span className="comp-brand">{comp.brand}</span>
                                                    {comp.prices?.length > 0 && (
                                                        <span className="comp-vendors">
                                                            {comp.prices.length} vendor{comp.prices.length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="comp-price">
                                                    {formatPrice(getLowestPrice(comp))}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
