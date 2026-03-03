import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getSavings, CATEGORIES } from '../services/api'
import toast from 'react-hot-toast'
import './Browse.css'

export default function Browse() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const [components, setComponents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [sort, setSort] = useState('price-low')
    const [detail, setDetail] = useState(null)
    const [compareList, setCompareList] = useState([])

    useEffect(() => {
        setLoading(true)
        API.getComponents({ category, search, sort })
            .then(setComponents)
            .catch(() => setComponents([]))
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
            if (prev.length >= 4) {
                toast.error('Maximum 4 items for comparison')
                return prev
            }
            return [...prev, item]
        })
    }

    const goCompare = () => {
        if (compareList.length < 2) {
            toast.error('Select at least 2 items to compare')
            return
        }
        const ids = compareList.map(c => c.id).join(',')
        navigate(`/compare?ids=${ids}`)
    }

    return (
        <main className="page-content">
            <div className="container">
                <header className="browse-header">
                    <div>
                        <h1>Browse Components</h1>
                        <p>Find the perfect parts for your build. Compare prices across Indian retailers.</p>
                    </div>
                    {compareList.length > 0 && (
                        <button className="btn btn-primary compare-btn" onClick={goCompare}>
                            Compare ({compareList.length}) →
                        </button>
                    )}
                </header>

                {/* Filters */}
                <section className="filters">
                    <input
                        type="search"
                        placeholder="Search components... (e.g. RTX 4060, Ryzen 5)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="search-input"
                    />

                    <div className="filter-chips">
                        <button
                            className={`chip ${!category ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('')}
                        >All</button>
                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                            <button
                                key={key}
                                className={`chip ${category === key ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(key)}
                            >
                                <span className="chip-icon">{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="filter-row">
                        <select value={sort} onChange={e => setSort(e.target.value)}>
                            <option value="price-low">Price: Low → High</option>
                            <option value="price-high">Price: High → Low</option>
                            <option value="name">Name: A → Z</option>
                        </select>
                        <span className="results-count">
                            {loading ? 'Searching...' : `${components.length} components found`}
                        </span>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="products-grid">
                    {loading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="product-card skeleton-card card">
                                <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 12 }} />
                                <div className="skeleton" style={{ height: 18, width: '85%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 28, width: '50%', marginBottom: 16 }} />
                                <div className="skeleton" style={{ height: 36, width: '100%' }} />
                            </div>
                        ))
                    ) : components.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🔍</span>
                            <h3>No components found</h3>
                            <p>Try adjusting your filters or search term</p>
                        </div>
                    ) : components.map(item => {
                        const lowest = getLowestPrice(item)
                        const savings = getSavings(item)
                        const isComparing = compareList.some(c => c.id === item.id)

                        return (
                            <article key={item.id} className={`product-card card ${isComparing ? 'comparing' : ''}`}>
                                <div className="product-top">
                                    <span className="product-badge">
                                        {CATEGORIES[item.category?.slug]?.name || item.category?.name || 'Part'}
                                    </span>
                                    <button
                                        className={`compare-check ${isComparing ? 'active' : ''}`}
                                        onClick={() => toggleCompare(item)}
                                        title="Add to compare"
                                    >
                                        {isComparing ? '✓' : '+'}
                                    </button>
                                </div>
                                <h3 className="product-title">{item.name}</h3>
                                <div className="product-brand">{item.brand}</div>
                                <div className="product-pricing">
                                    <span className="product-price">
                                        {lowest ? formatPrice(lowest) : 'Price N/A'}
                                    </span>
                                    {savings > 0 && (
                                        <span className="product-savings">
                                            Save {formatPrice(savings)}
                                        </span>
                                    )}
                                </div>
                                <div className="product-vendors">
                                    {item.prices?.length || 0} vendor{item.prices?.length !== 1 ? 's' : ''}
                                </div>
                                <button className="btn product-detail-btn" onClick={() => setDetail(item)}>
                                    View Details & Prices
                                </button>
                            </article>
                        )
                    })}
                </section>

                {/* Detail Modal */}
                {detail && (
                    <div className="modal-overlay" onClick={() => setDetail(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <span className="product-badge" style={{ marginBottom: 8 }}>
                                        {CATEGORIES[detail.category?.slug]?.name || 'Component'}
                                    </span>
                                    <h2>{detail.name}</h2>
                                </div>
                                <button className="modal-close" onClick={() => setDetail(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-meta">
                                    <p><strong>Brand:</strong> {detail.brand}</p>
                                    {detail.specs && Object.keys(detail.specs).length > 0 && (
                                        <div className="specs">
                                            <h4>Specifications</h4>
                                            <div className="specs-grid">
                                                {Object.entries(detail.specs).map(([k, v]) => (
                                                    <div key={k} className="spec-item">
                                                        <span className="spec-key">{k}</span>
                                                        <span className="spec-val">{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="price-comparison">
                                    <h4>Price Comparison</h4>
                                    {detail.prices?.length ? (
                                        <div className="vendor-list">
                                            {[...detail.prices]
                                                .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                                                .map((p, i) => (
                                                    <div key={i} className={`vendor-row ${i === 0 ? 'best-price' : ''}`}>
                                                        <div className="vendor-info">
                                                            {i === 0 && <span className="best-label">Best Price</span>}
                                                            <span className="vendor-name">{p.vendor?.name || 'Unknown'}</span>
                                                        </div>
                                                        <span className="vendor-price">{formatPrice(p.price)}</span>
                                                        {p.url && (
                                                            <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-sm">
                                                                Buy →
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="muted">No vendor pricing available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
