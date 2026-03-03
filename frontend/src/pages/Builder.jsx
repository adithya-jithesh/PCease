import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, BUILD_SLOTS } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiLink, FiSave, FiX, FiPlus, FiZap, FiActivity, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Builder.css'

export default function Builder() {
    const { shareId } = useParams()
    const { user } = useAuth()
    const [build, setBuild] = useState({})
    const [componentIds, setComponentIds] = useState({})
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

    useEffect(() => { if (shareId) loadSharedBuild(shareId) }, [shareId])

    useEffect(() => {
        if (Object.keys(componentIds).length > 0) API.calculateWattage(componentIds).then(setWattage).catch(() => {})
    }, [componentIds])

    useEffect(() => {
        if (componentIds.cpu && componentIds.gpu) API.checkBottleneck(componentIds.cpu, componentIds.gpu).then(setBottleneck).catch(() => {})
        else setBottleneck(null)
    }, [componentIds.cpu, componentIds.gpu])

    const loadSharedBuild = async (id) => {
        try {
            setLoading(true)
            const data = await API.getSharedBuild(id)
            setBuildName(data.name || 'Shared Build')
            setSharedView(true)
            if (data.components_detail) {
                const newBuild = {}, newIds = {}
                for (const [cat, comp] of Object.entries(data.components_detail)) { newBuild[cat] = comp; newIds[cat] = comp.id }
                setBuild(newBuild); setComponentIds(newIds)
            }
        } catch { toast.error('Failed to load shared build') }
        finally { setLoading(false) }
    }

    const openSlotModal = async (slotKey) => {
        setActiveSlot(slotKey); setSearchFilter(''); setLoading(true)
        try { setSlotComponents(await API.getComponents({ category: slotKey })) }
        catch { setSlotComponents([]) }
        finally { setLoading(false) }
    }

    const selectComponent = (comp) => {
        setBuild(p => ({ ...p, [activeSlot]: comp }))
        setComponentIds(p => ({ ...p, [activeSlot]: comp.id }))
        setActiveSlot(null); toast.success(`${comp.name} added`)
    }

    const removeComponent = (key) => {
        setBuild(p => { const n = { ...p }; delete n[key]; return n })
        setComponentIds(p => { const n = { ...p }; delete n[key]; return n })
    }

    const totalPrice = Object.values(build).reduce((s, c) => s + (getLowestPrice(c) || 0), 0)

    const handleSave = async () => {
        if (!user) return toast.error('Please login to save')
        setSaving(true)
        try { await API.saveBuild({ name: buildName, components: componentIds }); toast.success('Build saved!') }
        catch (e) { toast.error('Failed: ' + e.message) }
        finally { setSaving(false) }
    }

    const handleShare = async () => {
        if (!Object.keys(componentIds).length) return toast.error('Add components first')
        setSharing(true)
        try {
            const r = await API.shareBuild({ name: buildName, components: componentIds })
            await navigator.clipboard.writeText(`${window.location.origin}/builder/${r.share_id}`)
            toast.success('Share link copied!')
        } catch (e) { toast.error('Failed: ' + e.message) }
        finally { setSharing(false) }
    }

    const filtered = slotComponents.filter(c => !searchFilter || c.name.toLowerCase().includes(searchFilter.toLowerCase()))

    return (
        <main className="page">
            <div className="container">
                <header className="bd-header">
                    <div>
                        <h1>{sharedView ? 'Shared Build' : 'PC Builder'}</h1>
                        <p className="bd-header__sub">{sharedView ? 'Viewing a shared build — modify and save your own.' : 'Select components, check compatibility, and share.'}</p>
                    </div>
                    <div className="bd-actions">
                        <input type="text" value={buildName} onChange={e => setBuildName(e.target.value)} placeholder="Build name" className="bd-name" />
                        <button className="btn" onClick={handleShare} disabled={sharing}><FiLink size={14} /> {sharing ? '...' : 'Share'}</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? '...' : 'Save'}</button>
                    </div>
                </header>

                <div className="bd-layout">
                    <section className="bd-slots">
                        {BUILD_SLOTS.map(slot => {
                            const sel = build[slot.key]
                            return (
                                <div key={slot.key} className={`bd-slot ${sel ? 'bd-slot--filled' : ''}`}>
                                    <div className="bd-slot__head">
                                        <span className="bd-slot__name">{slot.name}</span>
                                        {slot.required && <span className="bd-slot__req">Required</span>}
                                    </div>
                                    {sel ? (
                                        <div className="bd-slot__sel">
                                            <div className="bd-slot__info">
                                                <strong>{sel.name}</strong>
                                                <span className="bd-slot__meta">{sel.brand} &middot; {formatPrice(getLowestPrice(sel))}</span>
                                            </div>
                                            <div className="bd-slot__btns">
                                                <button className="btn btn-sm" onClick={() => openSlotModal(slot.key)}>Change</button>
                                                <button className="btn btn-sm" onClick={() => removeComponent(slot.key)}><FiX size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="bd-slot__add" onClick={() => openSlotModal(slot.key)}><FiPlus size={14} /> Add {slot.name}</button>
                                    )}
                                </div>
                            )
                        })}
                    </section>

                    <aside className="bd-sidebar">
                        <div className="bd-summary">
                            <h3>Summary</h3>
                            <ul className="bd-summary__list">
                                {BUILD_SLOTS.map(slot => (
                                    <li key={slot.key} className={build[slot.key] ? 'has' : ''}>
                                        <span>{slot.name}</span>
                                        <span>{build[slot.key] ? formatPrice(getLowestPrice(build[slot.key])) : '—'}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="bd-summary__divider" />
                            <div className="bd-summary__total">
                                <span>Total</span>
                                <span className="bd-summary__price">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        {wattage && (
                            <div className="bd-info-card">
                                <h3><FiZap size={14} /> Power</h3>
                                <div className="bd-info__row"><span>Estimated TDP</span><span className="bd-info__val">{wattage.total_tdp}W</span></div>
                                <div className="bd-info__row"><span>Recommended PSU</span><span className="bd-info__val">{wattage.recommended_psu}W</span></div>
                            </div>
                        )}

                        {bottleneck && (
                            <div className={`bd-info-card bd-bn--${bottleneck.severity}`}>
                                <h3><FiActivity size={14} /> Bottleneck</h3>
                                <p className="bd-bn__msg">{bottleneck.message}</p>
                                <div className="bd-bn__tiers">
                                    <div><span>CPU</span><span className="bd-bn__bar">{'█'.repeat(bottleneck.cpu.tier)}{'░'.repeat(5 - bottleneck.cpu.tier)}</span></div>
                                    <div><span>GPU</span><span className="bd-bn__bar">{'█'.repeat(bottleneck.gpu.tier)}{'░'.repeat(5 - bottleneck.gpu.tier)}</span></div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>

                {activeSlot && (
                    <div className="modal-overlay" onClick={() => setActiveSlot(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Select {BUILD_SLOTS.find(s => s.key === activeSlot)?.name}</h2>
                                <button className="modal-close" onClick={() => setActiveSlot(null)}><FiX /></button>
                            </div>
                            <div className="modal-body">
                                <div className="bd-modal-search">
                                    <FiSearch className="bd-modal-search__icon" />
                                    <input type="search" placeholder="Filter..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
                                </div>
                                {loading ? <p className="text-muted">Loading...</p>
                                    : filtered.length === 0 ? <p className="text-muted">No components found</p>
                                    : <div className="bd-comp-list">
                                        {filtered.map(comp => (
                                            <button key={comp.id} className="bd-comp-opt" onClick={() => selectComponent(comp)}>
                                                <div>
                                                    <strong>{comp.name}</strong>
                                                    <span className="bd-comp-opt__brand">{comp.brand}{comp.prices?.length > 0 && ` · ${comp.prices.length} vendor${comp.prices.length !== 1 ? 's' : ''}`}</span>
                                                </div>
                                                <span className="bd-comp-opt__price">{formatPrice(getLowestPrice(comp))}</span>
                                            </button>
                                        ))}
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
