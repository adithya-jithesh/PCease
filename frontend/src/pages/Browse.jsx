import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getComponents, getCategories, formatPrice, getLowestPrice } from '../services/api'
import './Browse.css'

const categoryNames = {
    cpu: 'Processor', gpu: 'Graphics Card', motherboard: 'Motherboard',
    ram: 'Memory', storage: 'Storage', psu: 'Power Supply', pcCase: 'Case', monitor: 'Monitor'
}

export default function Browse() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [components, setComponents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [sort, setSort] = useState('price-low')
    const [detail, setDetail] = useState(null)

    useEffect(() => {
        setLoading(true)
        getComponents({ category, search, sort })
            .then(setComponents)
            .catch(() => setComponents([]))
            .finally(() => setLoading(false))
    }, [category, search, sort])

    const handleCategoryChange = (cat) => {
        setCategory(cat)
        if (cat) {
            setSearchParams({ category: cat })
        } else {
            setSearchParams({})
        }
    }

    return (
        <main className="page-content">
            <div className="container">
                <header className="browse-header">
                    <div>
                        <h1>Browse Components</h1>
                        <p>Find the perfect parts for your build. Compare prices across vendors.</p>
                    </div>
                </header>

                {/* Filters */}
                <section className="filters">
                    <input
                        type="search"
                        placeholder="Search components..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="search-input"
                    />

                    <div className="filter-chips">
                        <button
                            className={`chip ${!category ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('')}
                        >All</button>
                        {Object.entries(categoryNames).map(([key, name]) => (
                            <button
                                key={key}
                                className={`chip ${category === key ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(key)}
                            >{name}</button>
                        ))}
                    </div>

                    <div className="filter-row">
                        <select value={sort} onChange={e => setSort(e.target.value)}>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name: A-Z</option>
                        </select>
                        <span className="results-count">
                            {loading ? 'Loading...' : `${components.length} components`}
                        </span>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="products-grid">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="product-card skeleton-card">
                                <div className="skeleton" style={{ height: 24, width: '30%', marginBottom: 12 }}></div>
                                <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }}></div>
                                <div className="skeleton" style={{ height: 32, width: '50%', marginBottom: 16 }}></div>
                                <div className="skeleton" style={{ height: 40, width: '100%' }}></div>
                            </div>
                        ))
                    ) : components.length === 0 ? (
                        <div className="empty-state">
                            <h3>No components found</h3>
                            <p>Try adjusting your filters or search</p>
                        </div>
                    ) : components.map(item => (
                        <article key={item.id} className="product-card card">
                            <span className="product-badge">{categoryNames[item.category?.slug] || item.category_id}</span>
                            <h3 className="product-title">{item.name}</h3>
                            <div className="product-brand">{item.brand}</div>
                            <div className="product-price">
                                {item.prices?.length ? formatPrice(getLowestPrice(item)) : 'No price'}
                            </div>
                            <button className="btn" onClick={() => setDetail(item)}>Details</button>
                        </article>
                    ))}
                </section>

                {/* Detail Modal */}
                {detail && (
                    <div className="modal-overlay" onClick={() => setDetail(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{detail.name}</h2>
                                <button className="modal-close" onClick={() => setDetail(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Brand:</strong> {detail.brand}</p>
                                <p><strong>Category:</strong> {categoryNames[detail.category?.slug] || 'Unknown'}</p>
                                {detail.specs && (
                                    <div className="specs">
                                        <h4>Specifications</h4>
                                        <ul>
                                            {Object.entries(detail.specs).map(([k, v]) => (
                                                <li key={k}><strong>{k}:</strong> {v}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <h4>Vendors</h4>
                                {detail.prices?.length ? (
                                    <ul className="vendor-list">
                                        {detail.prices.map((p, i) => (
                                            <li key={i}>
                                                <span>{p.vendor?.name}</span>
                                                <span>{formatPrice(p.price)}</span>
                                                {p.url && <a href={p.url} target="_blank" rel="noreferrer">Buy →</a>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="muted">No vendors available</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
