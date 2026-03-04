import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getSavings, getBestVendor, CATEGORIES } from '../services/api'
import { FiSearch, FiX, FiExternalLink, FiCheck, FiPlus, FiGrid, FiList, FiShoppingCart, FiInfo, FiChevronRight, FiSliders, FiChevronDown } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Browse.css'

const SPEC_PRIORITY = {
    cpu: ['cores', 'boost_clock', 'socket', 'tdp'],
    gpu: ['memory', 'boost_clock', 'tdp', 'cuda_cores'],
    motherboard: ['socket', 'chipset', 'form_factor', 'ram_slots'],
    ram: ['capacity', 'speed', 'type', 'cas_latency'],
    storage: ['capacity', 'type', 'interface', 'read_speed'],
    psu: ['wattage', 'efficiency', 'modular'],
    case: ['form_factor', 'max_gpu_length', 'expansion_slots'],
    cooler: ['type', 'tdp_rating', 'fan_size'],
    monitor: ['resolution', 'refresh_rate', 'panel_type', 'size'],
    fans: ['size', 'quantity', 'airflow', 'rpm'],
}

const getKeySpecs = (item, maxCount = 4) => {
    if (!item.specs || !Object.keys(item.specs).length) return []
    const priority = SPEC_PRIORITY[item.category?.slug] || []
    const allKeys = Object.keys(item.specs)
    const ordered = [...priority.filter(k => k in item.specs), ...allKeys.filter(k => !priority.includes(k))]
    return ordered.slice(0, maxCount).map(k => ({
        key: k.replace(/_/g, ' '),
        val: String(item.specs[k]),
    }))
}

// Extracted skeleton components for reuse
const CardSkeleton = () => (
    <div className="br-card br-card--skeleton">
        <div className="skeleton" style={{ height: 14, width: '35%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 16, width: '85%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '30%', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
            <div className="skeleton" style={{ height: 22, width: '30%', borderRadius: 5 }} />
            <div className="skeleton" style={{ height: 22, width: '35%', borderRadius: 5 }} />
        </div>
        <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 34, width: '100%', borderRadius: 8 }} />
    </div>
)

const ListSkeleton = () => (
    <div className="br-list-item br-list-item--skeleton">
        <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} /><div className="skeleton" style={{ height: 16, width: '75%' }} /></div>
        <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}><div className="skeleton" style={{ height: 22, width: '28%', borderRadius: 5 }} /><div className="skeleton" style={{ height: 22, width: '32%', borderRadius: 5 }} /></div>
        <div style={{ width: 100 }}><div className="skeleton" style={{ height: 20, width: '80%' }} /></div>
        <div style={{ width: 80 }}><div className="skeleton" style={{ height: 30, width: '100%', borderRadius: 7 }} /></div>
    </div>
)

const EmptyState = ({ error }) => (
    <div className="br-empty">
        <FiSearch size={32} />
        <h3>No components found</h3>
        {error
            ? <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.8rem' }}>Error: {error}</p>
            : <p>Try adjusting your filters or search term</p>}
    </div>
)

export default function Browse() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const [components, setComponents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [sort, setSort] = useState('price-low')
    const [detail, setDetail] = useState(null)
    const [compareList, setCompareList] = useState([])
    const [viewMode, setViewMode] = useState('list')
    
    // Advanced filters
    const [showFilters, setShowFilters] = useState(false)
    const [brandFilter, setBrandFilter] = useState('')
    const [priceRange, setPriceRange] = useState({ min: '', max: '' })
    const [inStockOnly, setInStockOnly] = useState(false)

    useEffect(() => {
        setLoading(true)
        setError(null)
        API.getComponents({ category, search, sort })
            .then(data => setComponents(Array.isArray(data) ? data : []))
            .catch(e => { setError(e.message || 'Failed to load'); setComponents([]) })
            .finally(() => setLoading(false))
    }, [category, search, sort])

    // Get unique brands from loaded components
    const availableBrands = useMemo(() => {
        const brands = new Set(components.map(c => c.brand).filter(Boolean))
        return Array.from(brands).sort()
    }, [components])

    // Apply client-side filters
    const filteredComponents = useMemo(() => {
        let list = components
        
        // Brand filter
        if (brandFilter) {
            list = list.filter(c => c.brand === brandFilter)
        }
        
        // Price range filter
        if (priceRange.min || priceRange.max) {
            list = list.filter(c => {
                const price = getLowestPrice(c)
                if (!price) return false
                if (priceRange.min && price < parseFloat(priceRange.min)) return false
                if (priceRange.max && price > parseFloat(priceRange.max)) return false
                return true
            })
        }
        
        // In stock filter
        if (inStockOnly) {
            list = list.filter(c => (c.prices || []).length > 0)
        }
        
        return list
    }, [components, brandFilter, priceRange, inStockOnly])

    const clearAllFilters = useCallback(() => {
        setBrandFilter('')
        setPriceRange({ min: '', max: '' })
        setInStockOnly(false)
    }, [])

    const handleCategoryChange = useCallback((cat) => {
        setCategory(cat)
        const params = {}
        if (cat) params.category = cat
        if (search) params.search = search
        setSearchParams(params)
    }, [search, setSearchParams])

    const toggleCompare = useCallback((item) => {
        setCompareList(prev => {
            const exists = prev.find(c => c.id === item.id)
            if (exists) return prev.filter(c => c.id !== item.id)
            if (prev.length >= 4) { toast.error('Maximum 4 items'); return prev }
            return [...prev, item]
        })
    }, [])

    const goCompare = useCallback(() => {
        if (compareList.length < 2) { toast.error('Select at least 2 items'); return }
        navigate(`/compare?ids=${compareList.map(c => c.id).join(',')}`)
    }, [compareList, navigate])

    // Memoize compare list IDs for faster lookups
    const compareIds = useMemo(() => new Set(compareList.map(c => c.id)), [compareList])

    return (
        <main className="page">
            <div className="container">
                <header className="br-header">
                    <div>
                        <h1>Browse Components</h1>
                        <p className="br-header__sub">Find parts and compare prices across Indian retailers.</p>
                    </div>
                    {compareList.length > 0 && (
                        <button className="btn btn-primary" onClick={goCompare}>
                            Compare ({compareList.length})
                        </button>
                    )}
                </header>

                <section className="br-filters">
                    <div className="br-search-row">
                        <div className="br-search">
                            <FiSearch className="br-search__icon" />
                            <input type="search" placeholder="Search components..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button 
                            className={`btn br-filter-toggle${showFilters ? ' active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiSliders size={14} /> Filters {(brandFilter || priceRange.min || priceRange.max || inStockOnly) && <span className="br-filter-badge">!</span>}
                        </button>
                    </div>
                    
                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="br-advanced-filters">
                            <div className="br-filter-group">
                                <label>Brand</label>
                                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                                    <option value="">All Brands ({availableBrands.length})</option>
                                    {availableBrands.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="br-filter-group br-filter-group--price">
                                <label>Price Range (₹)</label>
                                <div className="br-price-inputs">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
                                    />
                                    <span>–</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="br-filter-group br-filter-group--checkbox">
                                <label className="br-checkbox">
                                    <input 
                                        type="checkbox" 
                                        checked={inStockOnly} 
                                        onChange={e => setInStockOnly(e.target.checked)} 
                                    />
                                    <span>In Stock Only</span>
                                </label>
                            </div>
                            <button className="btn btn-sm br-clear-filters" onClick={clearAllFilters}>
                                Clear All
                            </button>
                        </div>
                    )}
                    
                    <div className="br-chips">
                        <button className={`chip ${!category ? 'active' : ''}`} onClick={() => handleCategoryChange('')}>All</button>
                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                            <button key={key} className={`chip ${category === key ? 'active' : ''}`} onClick={() => handleCategoryChange(key)}>{cat.name}</button>
                        ))}
                    </div>
                    <div className="br-meta">
                        <select value={sort} onChange={e => setSort(e.target.value)}>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name: A-Z</option>
                        </select>
                        <span className="br-meta__count">
                            {loading ? 'Loading...' : filteredComponents.length !== components.length 
                                ? `${filteredComponents.length} of ${components.length} results` 
                                : `${components.length} results`}
                        </span>
                        <div className="br-view-toggle">
                            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid view"><FiGrid size={15} /></button>
                            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List view"><FiList size={15} /></button>
                        </div>
                    </div>
                </section>

                {/* ===== GRID VIEW ===== */}
                {viewMode === 'grid' && (
                    <section className="br-grid">
                        {loading
                            ? Array(12).fill(0).map((_, i) => <CardSkeleton key={i} />)
                            : filteredComponents.length === 0 ? <EmptyState error={error} />
                            : filteredComponents.map(item => {
                                const lowest = getLowestPrice(item)
                                const savings = getSavings(item)
                                const bestVendor = getBestVendor(item)
                                const isComp = compareIds.has(item.id)
                                const vendorCount = (item.prices || []).length
                                const keySpecs = getKeySpecs(item, 3)

                                return (
                                    <article key={item.id} className={`br-card${isComp ? ' br-card--selected' : ''}`} onClick={() => setDetail(item)}>
                                        <div className="br-card__top">
                                            <span className="br-card__badge">{CATEGORIES[item.category?.slug]?.name || 'Part'}</span>
                                            <button
                                                className={`br-card__cmp ${isComp ? 'active' : ''}`}
                                                onClick={e => { e.stopPropagation(); toggleCompare(item) }}
                                                title={isComp ? 'Remove from compare' : 'Add to compare'}
                                            >
                                                {isComp ? <FiCheck size={12} /> : <FiPlus size={12} />}
                                            </button>
                                        </div>

                                        <h3 className="br-card__title">{item.name}</h3>
                                        <span className="br-card__brand">{item.brand}</span>

                                        {keySpecs.length > 0 && (
                                            <div className="br-card__specs-preview">
                                                {keySpecs.map(s => (
                                                    <span key={s.key} className="br-spec-chip">
                                                        <span className="br-spec-chip__k">{s.key}</span>{s.val}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="br-card__price-row">
                                            <div className="br-card__price">
                                                <span className="br-card__amount">{lowest ? formatPrice(lowest) : 'N/A'}</span>
                                                {savings > 0 && <span className="br-card__save">Save {formatPrice(savings)}</span>}
                                            </div>
                                        </div>

                                        {bestVendor && (
                                            <div className="br-card__cheapest">
                                                <span className="br-card__cheapest-store">{bestVendor.vendor?.name || 'Store'}</span>
                                                {vendorCount > 1 && (
                                                    <span className="br-card__cheapest-more">+{vendorCount - 1} more</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="br-card__footer">
                                            <span className="br-card__view-details">
                                                View Details <FiChevronRight size={13} />
                                            </span>
                                        </div>
                                    </article>
                                )
                            })
                        }
                    </section>
                )}

                {/* ===== LIST VIEW ===== */}
                {viewMode === 'list' && (
                    <section className="br-list">
                        {loading
                            ? Array(8).fill(0).map((_, i) => <ListSkeleton key={i} />)
                            : filteredComponents.length === 0 ? <EmptyState error={error} />
                            : filteredComponents.map(item => {
                                const lowest = getLowestPrice(item)
                                const savings = getSavings(item)
                                const bestVendor = getBestVendor(item)
                                const isComp = compareIds.has(item.id)
                                const vendorCount = (item.prices || []).length
                                const keySpecs = getKeySpecs(item, 4)

                                return (
                                    <article key={item.id} className={`br-list-item${isComp ? ' br-list-item--selected' : ''}`}>
                                        <div className="br-list-item__main" onClick={() => setDetail(item)}>
                                            <div className="br-list-item__left">
                                                <div className="br-list-item__meta">
                                                    <span className="br-card__badge">{CATEGORIES[item.category?.slug]?.name || 'Part'}</span>
                                                    <span className="br-list-item__brand">{item.brand}</span>
                                                </div>
                                                <h3 className="br-list-item__name">{item.name}</h3>
                                                <div className="br-list-item__specs">
                                                    {keySpecs.map(s => (
                                                        <span key={s.key} className="br-spec-chip">
                                                            <span className="br-spec-chip__k">{s.key}</span>{s.val}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="br-list-item__price-col">
                                                <span className="br-list-item__price">{lowest ? formatPrice(lowest) : 'N/A'}</span>
                                                {savings > 0 && <span className="br-list-item__save">Save {formatPrice(savings)}</span>}
                                                {bestVendor && (
                                                    <span className="br-list-item__store">
                                                        {vendorCount > 1 ? `${vendorCount} stores` : bestVendor.vendor?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="br-list-item__actions">
                                            {bestVendor?.url ? (
                                                <a 
                                                    href={bestVendor.url} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="btn btn-sm btn-primary"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <FiExternalLink size={12} /> Buy
                                                </a>
                                            ) : (
                                                <button 
                                                    className="btn btn-sm"
                                                    onClick={() => setDetail(item)}
                                                >
                                                    View
                                                </button>
                                            )}
                                            <button
                                                className={`br-card__cmp ${isComp ? 'active' : ''}`}
                                                onClick={e => { e.stopPropagation(); toggleCompare(item) }}
                                                title={isComp ? 'Remove from compare' : 'Add to compare'}
                                            >
                                                {isComp ? <FiCheck size={12} /> : <FiPlus size={12} />}
                                            </button>
                                        </div>
                                    </article>
                                )
                            })
                        }
                    </section>
                )}

                {/* ===== DETAIL MODAL ===== */}
                {detail && (
                    <div className="modal-overlay" onClick={() => setDetail(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{detail.name}</h2>
                                <button className="modal-close" onClick={() => setDetail(null)}><FiX /></button>
                            </div>
                            <div className="modal-body">
                                <div className="br-detail-top">
                                    <span className="br-card__badge">{CATEGORIES[detail.category?.slug]?.name || 'Component'}</span>
                                    <span className="br-detail__brand">{detail.brand}</span>
                                </div>

                                {detail.specs && Object.keys(detail.specs).length > 0 && (
                                    <div className="br-specs">
                                        <h4><FiInfo size={14} /> Specifications</h4>
                                        <div className="br-specs__grid">
                                            {Object.entries(detail.specs).map(([k, v]) => (
                                                <div key={k} className="br-specs__item">
                                                    <span className="br-specs__key">{k.replace(/_/g, ' ')}</span>
                                                    <span className="br-specs__val">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="br-prices">
                                    <h4><FiShoppingCart size={14} /> Price Comparison — {detail.prices?.length || 0} retailers</h4>
                                    {detail.prices?.length ? (
                                        <div className="br-vendor-list">
                                            {[...detail.prices].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).map((p, i) => (
                                                <div key={i} className={`br-vendor${i === 0 ? ' br-vendor--best' : ''}`}>
                                                    <div className="br-vendor__info">
                                                        {i === 0 && <span className="br-vendor__label">Best Price</span>}
                                                        <span className="br-vendor__name">{p.vendor?.name || 'Unknown'}</span>
                                                    </div>
                                                    <span className="br-vendor__price">{formatPrice(p.price)}</span>
                                                    {p.url
                                                        ? <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" onClick={e => e.stopPropagation()}>
                                                            <FiExternalLink size={12} /> Visit
                                                          </a>
                                                        : <span className="btn btn-sm" style={{ opacity: 0.4, cursor: 'default' }}>No link</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-muted">No pricing available</p>}
                                </div>

                                <div className="br-detail__actions">
                                    <button
                                        className={`btn ${compareIds.has(detail.id) ? 'btn-primary' : ''}`}
                                        onClick={() => toggleCompare(detail)}
                                    >
                                        {compareIds.has(detail.id)
                                            ? <><FiCheck size={14} /> In Compare</>
                                            : <><FiPlus size={14} /> Add to Compare</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== STICKY COMPARE BAR ===== */}
                {compareList.length >= 1 && (
                    <div className="br-compare-bar">
                        <div className="br-compare-bar__items">
                            {compareList.map(c => (
                                <span key={c.id} className="br-compare-bar__item">
                                    <span className="br-compare-bar__item-name">{c.name}</span>
                                    <button onClick={() => toggleCompare(c)} className="br-compare-bar__rm"><FiX size={10} /></button>
                                </span>
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={goCompare} disabled={compareList.length < 2}>
                            Compare {compareList.length} {compareList.length === 1 ? '(need 1 more)' : 'items'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}
