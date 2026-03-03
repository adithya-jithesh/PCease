import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getSavings, CATEGORIES } from '../services/api'
import { FiSearch, FiX, FiExternalLink, FiCheck, FiPlus, FiGrid, FiList, FiShoppingCart } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Browse.css'

// Priority spec keys per category to show inline
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

function getKeySpecs(item, maxCount = 4) {
    if (!item.specs || !Object.keys(item.specs).length) return []
    const priority = SPEC_PRIORITY[item.category?.slug] || []
    const allKeys = Object.keys(item.specs)
    const ordered = [...priority.filter(k => k in item.specs), ...allKeys.filter(k => !priority.includes(k))]
    return ordered.slice(0, maxCount).map(k => ({
        key: k.replace(/_/g, ' '),
        val: String(item.specs[k]),
    }))
}

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
    const [viewMode, setViewMode] = useState('grid')

    useEffect(() => {
        setLoading(true)
        setError(null)
        API.getComponents({ category, search, sort })
            .then(data => setComponents(Array.isArray(data) ? data : []))
            .catch(e => { setError(e.message || 'Failed to load'); setComponents([]) })
            .finally(() => setLoading(false))
    }, [category, search, sort])

    const handleCategoryChange = (cat) => {
        setCategory(cat)
        const params = {}
        if (cat) params.category = cat
        if (search) params.search = search
        setSearchParams(params)
    }

    const toggleCompare = (item) => {
        setCompareList(prev => {
            const exists = prev.find(c => c.id === item.id)
            if (exists) return prev.filter(c => c.id !== item.id)
            if (prev.length >= 4) { toast.error('Maximum 4 items'); return prev }
            return [...prev, item]
        })
    }

    const goCompare = () => {
        if (compareList.length < 2) { toast.error('Select at least 2 items'); return }
        navigate(`/compare?ids=${compareList.map(c => c.id).join(',')}`)
    }

    const Skeleton = ({ mode }) => mode === 'list'
        ? <div className="br-list-item br-list-item--skeleton">
            <div style={{ flex: 2 }}><div className="skeleton" style={{ height: 13, width: '35%', marginBottom: 8 }} /><div className="skeleton" style={{ height: 17, width: '70%', marginBottom: 6 }} /><div className="skeleton" style={{ height: 13, width: '30%' }} /></div>
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 6 }}>{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 13, width: `${60 + i * 5}%` }} />)}</div>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 26, width: '100%', borderRadius: 6 }} />)}</div>
            <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 8 }} /><div className="skeleton" style={{ height: 32, width: '100%' }} /></div>
          </div>
        : <div className="br-card br-card--skeleton">
            <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 13, width: '30%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 50, width: '100%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 20, width: '45%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 70, width: '100%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 36, width: '100%' }} />
          </div>

    const EmptyState = () => (
        <div className="br-empty">
            <FiSearch size={32} />
            <h3>No components found</h3>
            {error
                ? <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.8rem' }}>Error: {error}</p>
                : <p>Try adjusting your filters or search term</p>}
        </div>
    )

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
                    <div className="br-search">
                        <FiSearch className="br-search__icon" />
                        <input type="search" placeholder="Search components..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
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
                        <span className="br-meta__count">{loading ? 'Loading...' : `${components.length} results`}</span>
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
                            ? Array(8).fill(0).map((_, i) => <Skeleton key={i} mode="grid" />)
                            : components.length === 0 ? <EmptyState />
                            : components.map(item => {
                                const lowest = getLowestPrice(item)
                                const savings = getSavings(item)
                                const isComp = compareList.some(c => c.id === item.id)
                                const sortedPrices = [...(item.prices || [])].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                                const keySpecs = getKeySpecs(item, 3)
                                return (
                                    <article key={item.id} className={`br-card ${isComp ? 'br-card--selected' : ''}`}>
                                        <div className="br-card__top">
                                            <span className="br-card__badge">{CATEGORIES[item.category?.slug]?.name || 'Part'}</span>
                                            <button className={`br-card__cmp ${isComp ? 'active' : ''}`} onClick={() => toggleCompare(item)} title={isComp ? 'Remove from compare' : 'Add to compare'}>
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

                                        <div className="br-card__price">
                                            <span className="br-card__amount">{lowest ? formatPrice(lowest) : 'N/A'}</span>
                                            {savings > 0 && <span className="br-card__save">Save {formatPrice(savings)}</span>}
                                        </div>

                                        {sortedPrices.length > 0 && (
                                            <div className="br-card__vendor-prices">
                                                {sortedPrices.slice(0, 3).map((p, i) => (
                                                    <div key={i} className={`br-card__vp ${i === 0 ? 'br-card__vp--best' : ''}`}>
                                                        <span className="br-card__vp-name">{p.vendor?.name || 'Store'}</span>
                                                        <span className="br-card__vp-price">{formatPrice(p.price)}</span>
                                                        {p.url
                                                            ? <a href={p.url} target="_blank" rel="noreferrer" className="br-card__vp-link" onClick={e => e.stopPropagation()} title={`Buy at ${p.vendor?.name}`}>
                                                                <FiExternalLink size={11} />
                                                              </a>
                                                            : <span className="br-card__vp-link br-card__vp-link--none" />}
                                                    </div>
                                                ))}
                                                {sortedPrices.length > 3 && (
                                                    <button className="br-card__more" onClick={() => setDetail(item)}>+{sortedPrices.length - 3} more stores</button>
                                                )}
                                            </div>
                                        )}

                                        <button className="btn br-card__btn" onClick={() => setDetail(item)}>Full Details &amp; All Prices</button>
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
                            ? Array(6).fill(0).map((_, i) => <Skeleton key={i} mode="list" />)
                            : components.length === 0 ? <EmptyState />
                            : components.map(item => {
                                const lowest = getLowestPrice(item)
                                const savings = getSavings(item)
                                const isComp = compareList.some(c => c.id === item.id)
                                const sortedPrices = [...(item.prices || [])].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                                const keySpecs = getKeySpecs(item, 5)
                                return (
                                    <article key={item.id} className={`br-list-item ${isComp ? 'br-list-item--selected' : ''}`}>
                                        <div className="br-list-item__left">
                                            <span className="br-card__badge">{CATEGORIES[item.category?.slug]?.name || 'Part'}</span>
                                            <h3 className="br-list-item__name">{item.name}</h3>
                                            <span className="br-card__brand">{item.brand}</span>
                                        </div>

                                        <div className="br-list-item__specs">
                                            {keySpecs.map(s => (
                                                <div key={s.key} className="br-list-item__spec">
                                                    <span className="br-list-item__spec-k">{s.key}</span>
                                                    <span className="br-list-item__spec-v">{s.val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="br-list-item__vendors">
                                            {sortedPrices.length === 0
                                                ? <span className="text-muted" style={{ fontSize: '0.8125rem' }}>No pricing available</span>
                                                : sortedPrices.slice(0, 5).map((p, i) => (
                                                    <div key={i} className={`br-list-vp ${i === 0 ? 'br-list-vp--best' : ''}`}>
                                                        <span className="br-list-vp__name">{p.vendor?.name || 'Store'}</span>
                                                        <span className="br-list-vp__price">{formatPrice(p.price)}</span>
                                                        {p.url
                                                            ? <a href={p.url} target="_blank" rel="noreferrer" className="br-list-vp__link">
                                                                <FiShoppingCart size={11} /> Buy
                                                              </a>
                                                            : <span className="br-list-vp__no-link">No link</span>}
                                                    </div>
                                                ))
                                            }
                                            {sortedPrices.length > 5 && (
                                                <button className="br-card__more" onClick={() => setDetail(item)}>+{sortedPrices.length - 5} more</button>
                                            )}
                                        </div>

                                        <div className="br-list-item__actions">
                                            <div className="br-list-item__price">
                                                <span className="br-card__amount">{lowest ? formatPrice(lowest) : 'N/A'}</span>
                                                {savings > 0 && <span className="br-card__save">-{formatPrice(savings)}</span>}
                                            </div>
                                            <div className="br-list-item__btns">
                                                <button
                                                    className={`br-card__cmp ${isComp ? 'active' : ''}`}
                                                    onClick={() => toggleCompare(item)}
                                                    title={isComp ? 'Remove from compare' : 'Add to compare'}
                                                >
                                                    {isComp ? <FiCheck size={12} /> : <FiPlus size={12} />}
                                                </button>
                                                <button className="btn btn-sm" onClick={() => setDetail(item)}>Details</button>
                                            </div>
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
                                <div>
                                    <span className="br-card__badge" style={{ marginBottom: 8 }}>{CATEGORIES[detail.category?.slug]?.name || 'Component'}</span>
                                    <h2>{detail.name}</h2>
                                </div>
                                <button className="modal-close" onClick={() => setDetail(null)}><FiX /></button>
                            </div>
                            <div className="modal-body">
                                <p className="br-detail__brand"><strong>Brand:</strong> {detail.brand}</p>

                                {detail.specs && Object.keys(detail.specs).length > 0 && (
                                    <div className="br-specs">
                                        <h4>Specifications</h4>
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
                                    <h4>Price Comparison — {detail.prices?.length || 0} stores</h4>
                                    {detail.prices?.length ? (
                                        <div className="br-vendor-list">
                                            {[...detail.prices].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).map((p, i) => (
                                                <div key={i} className={`br-vendor ${i === 0 ? 'br-vendor--best' : ''}`}>
                                                    <div className="br-vendor__info">
                                                        {i === 0 && <span className="br-vendor__label">Best Price</span>}
                                                        <span className="br-vendor__name">{p.vendor?.name || 'Unknown'}</span>
                                                        {p.in_stock === false && <span className="br-vendor__oos">Out of Stock</span>}
                                                    </div>
                                                    <span className="br-vendor__price">{formatPrice(p.price)}</span>
                                                    {p.url
                                                        ? <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                                                            <FiShoppingCart size={13} /> Buy Now
                                                          </a>
                                                        : <span className="btn btn-sm" style={{ opacity: 0.4, cursor: 'default' }}>No link</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-muted">No pricing available</p>}
                                </div>

                                <div className="br-detail__actions">
                                    <button
                                        className={`btn ${compareList.some(c => c.id === detail.id) ? 'btn-primary' : ''}`}
                                        onClick={() => toggleCompare(detail)}
                                    >
                                        {compareList.some(c => c.id === detail.id)
                                            ? <><FiCheck size={14} /> Added to Compare</>
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
                        <button
                            className="btn btn-primary"
                            onClick={goCompare}
                            disabled={compareList.length < 2}
                        >
                            Compare {compareList.length} {compareList.length === 1 ? '(need 1 more)' : 'items'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}
