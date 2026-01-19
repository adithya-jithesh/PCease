import { useState, useEffect } from 'react'
import { getComponents, formatPrice, getLowestPrice, saveBuild } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Builder.css'

const slots = [
    { key: 'cpu', name: 'Processor', required: true },
    { key: 'gpu', name: 'Graphics Card', required: false },
    { key: 'motherboard', name: 'Motherboard', required: true },
    { key: 'ram', name: 'Memory', required: true },
    { key: 'storage', name: 'Storage', required: true },
    { key: 'psu', name: 'Power Supply', required: true },
    { key: 'pcCase', name: 'Case', required: false },
    { key: 'monitor', name: 'Monitor', required: false }
]

export default function Builder() {
    const { user } = useAuth()
    const [build, setBuild] = useState({})
    const [components, setComponents] = useState({})
    const [activeSlot, setActiveSlot] = useState(null)
    const [slotComponents, setSlotComponents] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [buildName, setBuildName] = useState('My Build')

    const openSlotModal = async (slotKey) => {
        setActiveSlot(slotKey)
        setLoading(true)
        try {
            const items = await getComponents({ category: slotKey })
            setSlotComponents(items)
        } catch {
            setSlotComponents([])
        } finally {
            setLoading(false)
        }
    }

    const selectComponent = (component) => {
        setBuild(prev => ({ ...prev, [activeSlot]: component }))
        setComponents(prev => ({ ...prev, [activeSlot]: component.id }))
        setActiveSlot(null)
    }

    const removeComponent = (slotKey) => {
        setBuild(prev => {
            const next = { ...prev }
            delete next[slotKey]
            return next
        })
        setComponents(prev => {
            const next = { ...prev }
            delete next[slotKey]
            return next
        })
    }

    const totalPrice = Object.values(build).reduce((sum, comp) => {
        return sum + (getLowestPrice(comp) || 0)
    }, 0)

    const handleSave = async () => {
        if (!user) {
            alert('Please login to save your build')
            return
        }
        setSaving(true)
        try {
            await saveBuild({ name: buildName, components })
            alert('Build saved!')
        } catch (e) {
            alert('Failed to save: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="page-content">
            <div className="container">
                <header className="builder-header">
                    <div>
                        <h1>PC Builder</h1>
                        <p>Select components to build your PC. We'll check compatibility.</p>
                    </div>
                    <div className="builder-actions">
                        <input
                            type="text"
                            value={buildName}
                            onChange={e => setBuildName(e.target.value)}
                            placeholder="Build name"
                            className="build-name-input"
                        />
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Build'}
                        </button>
                    </div>
                </header>

                <div className="builder-layout">
                    <section className="slots-list">
                        {slots.map(slot => {
                            const selected = build[slot.key]
                            return (
                                <div key={slot.key} className={`slot-card card ${selected ? 'filled' : ''}`}>
                                    <div className="slot-header">
                                        <span className="slot-name">{slot.name}</span>
                                        {slot.required && <span className="required">Required</span>}
                                    </div>
                                    {selected ? (
                                        <div className="slot-selected">
                                            <div className="selected-info">
                                                <strong>{selected.name}</strong>
                                                <span>{formatPrice(getLowestPrice(selected))}</span>
                                            </div>
                                            <div className="slot-btns">
                                                <button className="btn" onClick={() => openSlotModal(slot.key)}>Change</button>
                                                <button className="btn" onClick={() => removeComponent(slot.key)}>Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="btn add-btn" onClick={() => openSlotModal(slot.key)}>
                                            + Add {slot.name}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </section>

                    <aside className="build-summary card">
                        <h3>Build Summary</h3>
                        <ul className="summary-list">
                            {slots.map(slot => (
                                <li key={slot.key}>
                                    <span>{slot.name}</span>
                                    <span>{build[slot.key]?.name?.slice(0, 20) || '—'}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="total-price">
                            <span>Total</span>
                            <span className="price">{formatPrice(totalPrice)}</span>
                        </div>
                    </aside>
                </div>

                {/* Component Selection Modal */}
                {activeSlot && (
                    <div className="modal-overlay" onClick={() => setActiveSlot(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Select {slots.find(s => s.key === activeSlot)?.name}</h2>
                                <button className="modal-close" onClick={() => setActiveSlot(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                {loading ? (
                                    <div className="loading">Loading components...</div>
                                ) : slotComponents.length === 0 ? (
                                    <p className="muted">No components available</p>
                                ) : (
                                    <div className="component-list">
                                        {slotComponents.map(comp => (
                                            <button
                                                key={comp.id}
                                                className="component-option"
                                                onClick={() => selectComponent(comp)}
                                            >
                                                <div>
                                                    <strong>{comp.name}</strong>
                                                    <span className="brand">{comp.brand}</span>
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
