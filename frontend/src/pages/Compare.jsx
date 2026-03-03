import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getBestVendor, getSavings } from '../services/api'
import toast from 'react-hot-toast'
import {
    FiPlus, FiX, FiSearch, FiAward, FiPackage,
    FiArrowRight, FiExternalLink, FiTrendingDown, FiLoader
} from 'react-icons/fi'
import './Compare.css'

const MAX_SLOTS = 4

export default function Compare() {
    const [searchParams] = useSearchParams()
    const [slots, setSlots] = useState([null, null, null, null])
    const [loading, setLoading] = useState(true)
    const [activeSlot, setActiveSlot] = useState(null)
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const searchRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []
        if (!ids.length) { setLoading(false); return }
        API.compareComponents(ids)
            .then(data => {
                const components = data.components || data
                setSlots(prev => {
                    const next = [...prev]
                    components.forEach((c, i) => { if (i < MAX_SLOTS) next[i] = c })
                    return next
                })
            })
            .catch(e => toast.error('Failed to load comparison: ' + e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!query.trim()) { setSearchResults([]); return }
        const t = setTimeout(() => {
            setSearching(true)
            API.getComponents({ search: query })
                .then(data => {
                    const list = data.components || data || []
                    const used = new Set(slots.filter(Boolean).map(s => s.id))
                    setSearchResults(list.filter(c => !used.has(c.id)).slice(0, 8))
                })
                .catch(() => setSearchResults([]))
                .finally(() => setSearching(false))
        }, 300)
        return () => clearTimeout(t)
    }, [query, slots])

    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) closeSearch()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const openSearch = (slotIdx) => {
        setActiveSlot(slotIdx)
        setQuery('')
        setSearchResults([])
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const closeSearch = () => {
        setActiveSlot(null)
        setQuery('')
        setSearchResults([])
    }

    const addComponent = (component) => {
        if (activeSlot === null) return
        setSlots(prev => {
            const next = [...prev]
            next[activeSlot] = component
            return next
        })
        closeSearch()
    }

    const removeComponent = (slotIdx) => {
        setSlots(prev => {
            const next = [...prev]
            next[slotIdx] = null
            const filled = next.filter(Boolean)
            return [...filled, ...Array(MAX_SLOTS - filled.length).fill(null)]
        })
    }

    const filledSlots = slots.filter(Boolean)

    const getSpecs = (item) => {
        if (typeof item.specifications === 'string') {
            try { return JSON.parse(item.specifications) } catch { return {} }
        }
        return item.specifications || {}
    }

    const getPricesSorted = (item) =>
        (item.prices || []).slice().sort((a, b) => a.price - b.price)

    const bestSlotIdx = filledSlots.length > 0
        ? filledSlots.reduce((bestIdx, cur, idx) => {
            const curLow = getLowestPrice(cur)
            const bestLow = getLowestPrice(filledSlots[bestIdx])
            return curLow < bestLow ? idx : bestIdx
        }, 0)
        : 0

    if (loading) {
        return (
            <main className="page">
                <div className="container">
                    <div className="cp-loading">
                        <FiLoader size={28} className="cp-spin" />
                        <p>Loading comparison...</p>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="page">
            <div className="container">

                <header className="cp-header">
                    <div>
                        <h1>Compare Components</h1>
                        <p className="cp-header__sub">
                            Price comparison across 9 Indian retailers  Up to {MAX_SLOTS} components
                        </p>
                    </div>
                    <Link to="/browse" className="btn btn-secondary">Browse All</Link>
                </header>

                <div className={`cp-slots cp-slots--${Math.max(filledSlots.length + (filledSlots.length < MAX_SLOTS ? 1 : 0), 2)}`}>
                    {slots.map((slot, idx) => {
                        const prevFilled = idx === 0 || slots[idx - 1] !== null
                        const showSlot = slot !== null || (prevFilled && idx < MAX_SLOTS)
                        if (!showSlot) return null

                        const prices = slot ? getPricesSorted(slot) : []
                        const low = slot ? getLowestPrice(slot) : 0
                        const maxP = slot ? Math.max(...prices.map(p => p.price), 1) : 1
                        const isBest = slot && filledSlots.indexOf(slot) === bestSlotIdx

                        return (
                            <div
                                key={idx}
                                className={`cp-card${slot ? ' cp-card--filled' : ' cp-card--empty'}${isBest ? ' cp-card--best' : ''}`}
                            >
                                {slot ? (
                                    <>
                                        {isBest && filledSlots.length > 1 && (
                                            <span className="cp-card__badge">
                                                <FiTrendingDown size={11} /> Best Price
                                            </span>
                                        )}
                                        <button className="cp-card__remove" onClick={() => removeComponent(idx)} title="Remove">
                                            <FiX size={14} />
                                        </button>
                                        <div className="cp-card__img">
                                            {slot.image_url
                                                ? <img src={slot.image_url} alt={slot.name} />
                                                : <FiPackage size={32} />}
                                        </div>
                                        <div className="cp-card__info">
                                            <span className="cp-card__category">
                                                {slot.category?.name || slot.category_name || 'Component'}
                                            </span>
                                            <h3 className="cp-card__name">{slot.name}</h3>
                                            {slot.brand && <p className="cp-card__brand">{slot.brand}</p>}
                                        </div>
                                        <div className="cp-card__price-hero">
                                            <span className="cp-card__price-label">From</span>
                                            <span className="cp-card__price-value">{formatPrice(low)}</span>
                                            <span className="cp-card__price-vendor">{getBestVendor(slot)?.vendor?.name || getBestVendor(slot)?.vendor_name || ''}</span>
                                        </div>
                                        <div className="cp-card__vendors">
                                            {prices.map((p, j) => {
                                                const pct = Math.round((p.price / maxP) * 100)
                                                const isLowest = j === 0
                                                return (
                                                    <div key={j} className={`cp-vendor-row${isLowest ? ' cp-vendor-row--best' : ''}`}>
                                                        <div className="cp-vendor-row__meta">
                                                            <span className="cp-vendor-row__name">
                                                                {p.vendor?.name || p.vendor_name || 'Store'}
                                                            </span>
                                                            <span className="cp-vendor-row__price">
                                                                {formatPrice(p.price)}
                                                            </span>
                                                            {p.url && (
                                                                <a href={p.url} target="_blank" rel="noopener" className="cp-vendor-row__link">
                                                                    <FiExternalLink size={11} />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="cp-vendor-row__bar-track">
                                                            <div className="cp-vendor-row__bar-fill" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {Object.keys(getSpecs(slot)).length > 0 && (
                                            <details className="cp-card__specs">
                                                <summary>Specs</summary>
                                                <div className="cp-card__specs-grid">
                                                    {Object.entries(getSpecs(slot)).slice(0, 8).map(([k, v]) => (
                                                        <div key={k} className="cp-spec-row">
                                                            <span className="cp-spec-row__key">{k.replace(/_/g, ' ')}</span>
                                                            <span className="cp-spec-row__val">{v}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </>
                                ) : (
                                    <button className="cp-card__add-btn" onClick={() => openSearch(idx)}>
                                        <FiPlus size={28} />
                                        <span>Add Component</span>
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {activeSlot !== null && (
                    <div className="cp-overlay">
                        <div className="cp-search-panel" ref={searchRef}>
                            <div className="cp-search-panel__header">
                                <h3>Add Component</h3>
                                <button className="cp-search-panel__close" onClick={closeSearch}>
                                    <FiX size={18} />
                                </button>
                            </div>
                            <div className="cp-search-panel__input-wrap">
                                <FiSearch size={16} className="cp-search-panel__icon" />
                                <input
                                    ref={inputRef}
                                    className="cp-search-panel__input"
                                    placeholder="Search by name, brand, or category..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                />
                                {searching && <FiLoader size={14} className="cp-spin cp-search-panel__spinner" />}
                            </div>
                            <div className="cp-search-panel__results">
                                {!query.trim() && (
                                    <p className="cp-search-panel__hint">Start typing to search components</p>
                                )}
                                {query.trim() && !searching && searchResults.length === 0 && (
                                    <p className="cp-search-panel__hint">No results found</p>
                                )}
                                {searchResults.map(c => {
                                    const low = getLowestPrice(c)
                                    return (
                                        <button key={c.id} className="cp-search-result" onClick={() => addComponent(c)}>
                                            <div className="cp-search-result__img">
                                                {c.image_url ? <img src={c.image_url} alt={c.name} /> : <FiPackage size={20} />}
                                            </div>
                                            <div className="cp-search-result__info">
                                                <span className="cp-search-result__cat">
                                                    {c.category?.name || c.category_name}
                                                </span>
                                                <span className="cp-search-result__name">{c.name}</span>
                                            </div>
                                            <span className="cp-search-result__price">
                                                {low ? formatPrice(low) : '--'}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {filledSlots.length >= 2 && (
                    <section className="cp-verdict">
                        <FiAward size={20} className="cp-verdict__icon" />
                        <h3>Quick Verdict</h3>
                        <p>
                            <strong>{filledSlots[bestSlotIdx]?.name}</strong> offers the best price at{' '}
                            <strong className="cp-verdict__price">
                                {formatPrice(getLowestPrice(filledSlots[bestSlotIdx]))}
                            </strong>
                            {getSavings(filledSlots[bestSlotIdx]) > 0 && (
                                <> — you save <strong className="cp-verdict__savings">
                                    {formatPrice(getSavings(filledSlots[bestSlotIdx]))}
                                </strong> vs the highest listed price</>
                            )}.
                        </p>
                        <Link to="/builder" className="btn btn-primary">
                            Add to Builder <FiArrowRight size={16} />
                        </Link>
                    </section>
                )}

                {filledSlots.length === 0 && (
                    <div className="cp-empty">
                        <FiPackage size={40} />
                        <h2>Nothing to compare yet</h2>
                        <p>Click <strong>Add Component</strong> in any slot above, or go to Browse and use the compare button.</p>
                        <Link to="/browse" className="btn btn-primary">Browse Components <FiArrowRight size={16} /></Link>
                    </div>
                )}

            </div>
        </main>
    )
}
