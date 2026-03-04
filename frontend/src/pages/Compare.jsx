import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getBestVendor, getSavings } from '../services/api'
import toast from 'react-hot-toast'
import {
    FiPlus, FiX, FiSearch, FiAward, FiPackage,
    FiArrowRight, FiExternalLink, FiTrendingDown, FiLoader, FiShoppingCart
} from 'react-icons/fi'
import './Compare.css'

// Spec keys where lower value = better
const LOWER_IS_BETTER = new Set(['tdp', 'wattage', 'power', 'cas_latency', 'latency', 'noise_level'])

function getSpecsObj(item) {
    const s = item?.specs || item?.specifications
    if (!s) return {}
    if (typeof s === 'string') { try { return JSON.parse(s) } catch { return {} } }
    return s
}

function parseNum(v) {
    if (v === null || v === undefined) return null
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''))
    return isNaN(n) ? null : n
}

function SpecsComparisonTable({ components }) {
    if (!components || components.length < 2) return null
    const allSpecs = components.map(getSpecsObj)
    const allKeys = [...new Set(allSpecs.flatMap(s => Object.keys(s)))]
    if (!allKeys.length) return null

    return (
        <section className="cp-specs-table">
            <h2 className="cp-specs-table__title">Specs Comparison</h2>
            <div className="cp-specs-table__wrap">
                <table className="cp-specs-tbl">
                    <thead>
                        <tr>
                            <th className="cp-specs-tbl__label-col">Specification</th>
                            {components.map((c, i) => (
                                <th key={i} className="cp-specs-tbl__comp-col">
                                    <span className="cp-specs-tbl__comp-name">{c.name}</span>
                                    <span className="cp-specs-tbl__comp-brand">{c.brand}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allKeys.map(key => {
                            const vals = allSpecs.map(s => s[key] !== undefined ? s[key] : null)
                            const nums = vals.map(parseNum)
                            const allNum = nums.every(n => n !== null)
                            let bestIdx = -1
                            if (allNum) {
                                bestIdx = LOWER_IS_BETTER.has(key)
                                    ? nums.indexOf(Math.min(...nums))
                                    : nums.indexOf(Math.max(...nums))
                            }
                            return (
                                <tr key={key}>
                                    <td className="cp-specs-tbl__key">{key.replace(/_/g, ' ')}</td>
                                    {vals.map((v, i) => (
                                        <td key={i} className={`cp-specs-tbl__val${i === bestIdx ? ' cp-specs-tbl__val--best' : ''}${v === null ? ' cp-specs-tbl__val--na' : ''}`}>
                                            {v !== null ? String(v) : '—'}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <p className="cp-specs-table__note">Green = best value for that spec</p>
        </section>
    )
}

const MAX_SLOTS = 4

export default function Compare() {
    const [searchParams] = useSearchParams()
    const [slots, setSlots] = useState([null, null, null, null])
    const [loading, setLoading] = useState(true)
    const [activeSlot, setActiveSlot] = useState(null)
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
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
        API.getCategories()
            .then(data => setCategories(data || []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!query.trim() && !selectedCategory) { setSearchResults([]); return }
        const t = setTimeout(() => {
            setSearching(true)
            const params = { limit: 50 }
            if (query.trim()) params.search = query
            if (selectedCategory) params.category = selectedCategory
            API.getComponents(params)
                .then(data => {
                    const list = data.components || data || []
                    const used = new Set(slots.filter(Boolean).map(s => s.id))
                    setSearchResults(list.filter(c => !used.has(c.id)).slice(0, 12))
                })
                .catch(() => setSearchResults([]))
                .finally(() => setSearching(false))
        }, 300)
        return () => clearTimeout(t)
    }, [query, selectedCategory, slots])

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
        setSelectedCategory('')
        setSearchResults([])
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const closeSearch = () => {
        setActiveSlot(null)
        setQuery('')
        setSelectedCategory('')
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
                                                            {p.url
                                                                ? <a href={p.url} target="_blank" rel="noopener" className="cp-vendor-row__link cp-vendor-row__link--buy" title="Buy now">
                                                                    <FiShoppingCart size={10} />
                                                                  </a>
                                                                : null}
                                                        </div>
                                                        <div className="cp-vendor-row__bar-track">
                                                            <div className="cp-vendor-row__bar-fill" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {Object.keys(getSpecs(slot)).length > 0 && (
                                            <div className="cp-card__specs">
                                                <div className="cp-card__specs-label">Specs</div>
                                                <div className="cp-card__specs-grid">
                                                    {Object.entries(getSpecs(slot)).map(([k, v]) => (
                                                        <div key={k} className="cp-spec-row">
                                                            <span className="cp-spec-row__key">{k.replace(/_/g, ' ')}</span>
                                                            <span className="cp-spec-row__val">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
                            <div className="cp-search-panel__filters">
                                <button
                                    className={`chip${!selectedCategory ? ' active' : ''}`}
                                    onClick={() => setSelectedCategory('')}
                                >All</button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`chip${selectedCategory === cat.slug ? ' active' : ''}`}
                                        onClick={() => setSelectedCategory(cat.slug)}
                                    >{cat.name}</button>
                                ))}
                            </div>
                            <div className="cp-search-panel__results">
                                {!query.trim() && !selectedCategory && (
                                    <p className="cp-search-panel__hint">Search or select a category</p>
                                )}
                                {(query.trim() || selectedCategory) && !searching && searchResults.length === 0 && (
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

                <SpecsComparisonTable components={filledSlots} />

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
