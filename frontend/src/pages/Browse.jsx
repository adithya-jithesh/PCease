import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getSavings, CATEGORIES } from '../services/api'
import { FiSearch, FiX, FiExternalLink, FiCheck, FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Browse.css'

export default function Browse() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const [components, setComponents] = useState([])
    const [fetchError, setFetchError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [sort, setSort] = useState('price-low')
    const [detail, setDetail] = useState(null)
    const [compareList, setCompareList] = useState([])

    useEffect(() => {
        setLoading(true)
        setFetchError(null)
        API.getComponents({ category, search, sort })
            .then(data => {
                console.log('[Browse] getComponents returned:', Array.isArray(data) ? `array(${data.length})` : typeof data, data)
                setComponents(Array.isArray(data) ? data : [])
            })
            .catch(e => {
                console.error('[Browse] getComponents error:', e)
                setFetchError(e.message || 'Unknown error')
                setComponents([])
            })
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
                    </div>
                </section>

                <section className="br-grid">
                    {loading ? Array(8).fill(0).map((_, i) => (
                        <div key={i} className="br-card br-card--skeleton">
                            <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 24, width: '45%', marginBottom: 16 }} />
                            <div className="skeleton" style={{ height: 36, width: '100%' }} />
                        </div>
                    )) : components.length === 0 ? (
                        <div className="br-empty">
                            <FiSearch size={32} />
                            <h3>No components found</h3>
                            {fetchError
                                ? <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.8rem' }}>Error: {fetchError}</p>
                                : <p>Try adjusting your filters or search term</p>
                            }
                        </div>
                    ) : components.map(item => {
                        const lowest = getLowestPrice(item)
                        const savings = getSavings(item)
                        const isComp = compareList.some(c => c.id === item.id)

                        return (
                            <article key={item.id} className={`br-card ${isComp ? 'br-card--selected' : ''}`}>
                                <div className="br-card__top">
                                    <span className="br-card__badge">{CATEGORIES[item.category?.slug]?.name || 'Part'}</span>
                                    <button className={`br-card__cmp ${isComp ? 'active' : ''}`} onClick={() => toggleCompare(item)} title="Compare">
                                        {isComp ? <FiCheck size={12} /> : <FiPlus size={12} />}
                                    </button>
                                </div>
                                <h3 className="br-card__title">{item.name}</h3>
                                <span className="br-card__brand">{item.brand}</span>
                                <div className="br-card__price">
                                    <span className="br-card__amount">{lowest ? formatPrice(lowest) : 'N/A'}</span>
                                    {savings > 0 && <span className="br-card__save">Save {formatPrice(savings)}</span>}
                                </div>
                                <span className="br-card__vendors">{item.prices?.length || 0} vendor{item.prices?.length !== 1 ? 's' : ''}</span>
                                <button className="btn br-card__btn" onClick={() => setDetail(item)}>View Prices</button>
                            </article>
                        )
                    })}
                </section>

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
                                                    <span className="br-specs__key">{k}</span>
                                                    <span className="br-specs__val">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="br-prices">
                                    <h4>Price Comparison</h4>
                                    {detail.prices?.length ? (
                                        <div className="br-vendor-list">
                                            {[...detail.prices].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).map((p, i) => (
                                                <div key={i} className={`br-vendor ${i === 0 ? 'br-vendor--best' : ''}`}>
                                                    <div className="br-vendor__info">
                                                        {i === 0 && <span className="br-vendor__label">Best Price</span>}
                                                        <span>{p.vendor?.name || 'Unknown'}</span>
                                                    </div>
                                                    <span className="br-vendor__price">{formatPrice(p.price)}</span>
                                                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-sm"><FiExternalLink size={14} /> Buy</a>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-muted">No pricing available</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
