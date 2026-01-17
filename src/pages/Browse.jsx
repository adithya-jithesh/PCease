import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getComponentsStructured,
  getLowestPrice,
  getBestVendor,
  formatPrice,
  fuzzySearch,
  filterComponents
} from '../shared/api.js'
import '../styles/browse.css'

function transformDB(db) {
  const all = []
  for (const [category, items] of Object.entries(db)) {
    for (const item of items) {
      all.push({
        uid: `${category}-${item.id}`,
        id: item.id,
        name: item.name,
        category,
        brand: item.brand || 'Generic',
        vendors: item.vendors || [],
        ramType: item.ramType,
        formFactor: item.formFactor,
        cores: item.cores,
        memory: item.memory,
        capacity: item.capacity,
        wattage: item.wattage,
        socket: item.socket,
        type: item.type
      })
    }
  }
  return all
}

const categoryNames = {
  cpu: 'Processor',
  gpu: 'Graphics Card',
  motherboard: 'Motherboard',
  ram: 'Memory',
  storage: 'Storage',
  psu: 'Power Supply',
  pcCase: 'Case',
  monitor: 'Monitor',
  all: 'All Components'
}

function getCategoryName(cat) {
  return categoryNames[cat] || cat?.toUpperCase() || 'Unknown'
}

export default function Browse() {
  const [searchParams] = useSearchParams()
  const [db, setDb] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [brand, setBrand] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('price-low')

  // Lists
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites') || '[]') || [])
  const [compareList, setCompareList] = useState(() => JSON.parse(localStorage.getItem('compareList') || '[]') || [])

  // Modals
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [detail, setDetail] = useState({ open: false, item: null })

  useEffect(() => {
    let active = true
      ; (async () => {
        try {
          const grouped = await getComponentsStructured()
          if (active) setDb(grouped)
        } catch {
          if (active) setError('Failed to load components')
        } finally {
          if (active) setLoading(false)
        }
      })()
    return () => { active = false }
  }, [])

  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('compareList', JSON.stringify(compareList)) }, [compareList])

  const all = useMemo(() => transformDB(db), [db])
  const brands = useMemo(() => [...new Set(all.map(c => c.brand).filter(Boolean))].sort(), [all])
  const categories = useMemo(() => ['all', ...new Set(all.map(c => c.category))], [all])

  const results = useMemo(() => {
    // Start with search
    let r = search ? fuzzySearch(search, all) : [...all]

    // Apply filters
    r = filterComponents(r, {
      category: category !== 'all' ? category : null,
      brand: brand || null,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null
    })

    // Sort
    if (sortBy === 'price-low') {
      r.sort((a, b) => (getLowestPrice(a) || 999999) - (getLowestPrice(b) || 999999))
    } else if (sortBy === 'price-high') {
      r.sort((a, b) => (getLowestPrice(b) || 0) - (getLowestPrice(a) || 0))
    } else if (sortBy === 'name') {
      r.sort((a, b) => a.name.localeCompare(b.name))
    }

    return r
  }, [all, search, category, brand, minPrice, maxPrice, sortBy])

  const openDetail = (item) => setDetail({ open: true, item })
  const closeDetail = () => setDetail({ open: false, item: null })
  const toggleFavorite = (uid) => setFavorites(list => list.includes(uid) ? list.filter(x => x !== uid) : [...list, uid])
  const toggleCompare = (uid) => setCompareList(list => list.includes(uid) ? list.filter(x => x !== uid) : (list.length >= 3 ? list : [...list, uid]))

  const findByUid = (uid) => all.find(i => i.uid === uid)
  const favoriteItems = favorites.map(findByUid).filter(Boolean)
  const compareItems = compareList.map(findByUid).filter(Boolean)

  const clearFilters = () => {
    setSearch('')
    setCategory('all')
    setBrand('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('price-low')
  }

  if (loading) {
    return (
      <main className="container">
        <div className="browse-header">
          <div className="browse-header-info">
            <h1>Browse Components</h1>
            <p>Loading components...</p>
          </div>
        </div>
        <div className="products-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="product-card">
              <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 12 }}></div>
              <div className="skeleton" style={{ height: 24, width: '80%', marginBottom: 8 }}></div>
              <div className="skeleton" style={{ height: 32, width: '50%', marginBottom: 16 }}></div>
              <div className="skeleton" style={{ height: 40, width: '100%' }}></div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container">
        <div className="browse-header">
          <div className="browse-header-info">
            <h1>Browse Components</h1>
            <p className="muted">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="browse-header">
        <div className="browse-header-info">
          <h1>Browse Components</h1>
          <p>Find the perfect parts for your build. Compare prices across vendors.</p>
        </div>
      </div>

      {/* Controls */}
      <section className="controls">
        <div className="search-row">
          <input
            className="search-input"
            type="search"
            placeholder="Search components..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="chips-row">
          <div className="chips" role="toolbar" aria-label="Filter by category">
            {categories.map(c => (
              <button
                key={c}
                className={`chip ${c === category ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {getCategoryName(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Brand:</label>
            <select className="filter-select" value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="">All brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Price:</label>
            <div className="price-inputs">
              <input
                className="price-input"
                type="number"
                placeholder="Min ₹"
                min="0"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
              <span>—</span>
              <input
                className="price-input"
                type="number"
                placeholder="Max ₹"
                min="0"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Sort:</label>
            <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          <button className="clear-filters" onClick={clearFilters}>Clear All</button>
        </div>
      </section>

      {/* Toolbar */}
      <div className="toolbar-row">
        <span className="results-count">
          Showing <strong>{results.length}</strong> of {all.length} components
        </span>
        <div className="toolbar">
          <button className="toolbar-btn" onClick={() => setShowFavoritesModal(true)}>
            ⭐ Favorites {favorites.length > 0 && <span className="count">{favorites.length}</span>}
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setShowCompareModal(true)}
            disabled={compareList.length === 0}
          >
            ⚖️ Compare {compareList.length > 0 && <span className="count">{compareList.length}</span>}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <section className="products-grid">
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No components found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : results.map(item => {
          const lowestPrice = getLowestPrice(item)
          const bestVendor = getBestVendor(item)
          const uid = item.uid
          const isFav = favorites.includes(uid)
          const inCompare = compareList.includes(uid)

          return (
            <article key={uid} className="product-card">
              <div className="product-header">
                <span className="product-badge">{getCategoryName(item.category)}</span>
                <div className="product-actions-top">
                  <button
                    className={`icon-btn ${isFav ? 'active' : ''}`}
                    title="Add to favorites"
                    onClick={() => toggleFavorite(uid)}
                  >
                    {isFav ? '⭐' : '☆'}
                  </button>
                  <button
                    className={`icon-btn ${inCompare ? 'active' : ''}`}
                    title="Add to compare"
                    onClick={() => toggleCompare(uid)}
                    disabled={!inCompare && compareList.length >= 3}
                  >
                    {inCompare ? '✓' : '⚖️'}
                  </button>
                </div>
              </div>

              <h3 className="product-title">{item.name}</h3>

              {lowestPrice ? (
                <div className="product-price">{formatPrice(lowestPrice)}</div>
              ) : (
                <div className="product-price no-price">No offers available</div>
              )}

              <div className="product-buttons">
                <button className="btn" onClick={() => openDetail(item)}>Details</button>
                {bestVendor && (
                  <a className="btn primary" href={bestVendor.url} target="_blank" rel="noreferrer">
                    Buy →
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </section>

      {/* Detail Modal */}
      {detail.open && detail.item && (
        <div className="modal-container active" role="dialog" aria-modal="true">
          <div className="modal-overlay" onClick={closeDetail}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{detail.item.name}</h2>
              <button className="modal-close-btn" onClick={closeDetail}>&times;</button>
            </div>
            <div className="modal-body two-col">
              <div className="col">
                <h3>Specifications</h3>
                <ul className="specs-list">
                  <li><span>Brand</span><strong>{detail.item.brand}</strong></li>
                  <li><span>Category</span><strong>{getCategoryName(detail.item.category)}</strong></li>
                  {detail.item.cores && <li><span>Cores</span><strong>{detail.item.cores}</strong></li>}
                  {detail.item.socket && <li><span>Socket</span><strong>{detail.item.socket}</strong></li>}
                  {detail.item.memory && <li><span>Memory</span><strong>{detail.item.memory}</strong></li>}
                  {detail.item.capacity && <li><span>Capacity</span><strong>{detail.item.capacity}</strong></li>}
                  {detail.item.wattage && <li><span>Wattage</span><strong>{detail.item.wattage}W</strong></li>}
                  {detail.item.formFactor && <li><span>Form Factor</span><strong>{detail.item.formFactor}</strong></li>}
                  {detail.item.ramType && <li><span>RAM Type</span><strong>{detail.item.ramType}</strong></li>}
                  {detail.item.type && <li><span>Type</span><strong>{detail.item.type}</strong></li>}
                </ul>
              </div>
              <div className="col">
                <h3>Vendors</h3>
                {detail.item.vendors?.length ? (
                  <ul className="vendor-list">
                    {detail.item.vendors.map((v, i) => (
                      <li key={i} className="vendor-item">
                        <div className="vendor-info">
                          <a className="vendor-name" href={v.url} target="_blank" rel="noreferrer">{v.name}</a>
                          <span className={`stock-badge ${v.inStock || v.stock ? 'in-stock' : 'out-of-stock'}`}>
                            {v.inStock || v.stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <span className="vendor-price">{formatPrice(v.price)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No vendors listed for this item.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="modal-container active" role="dialog" aria-modal="true">
          <div className="modal-overlay" onClick={() => setShowFavoritesModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>⭐ Favorites</h2>
              <button className="modal-close-btn" onClick={() => setShowFavoritesModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {favoriteItems.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  No favorites yet. Click the star on any component to save it here.
                </p>
              ) : (
                <ul className="fav-list">
                  {favoriteItems.map(item => {
                    const bestVendor = getBestVendor(item)
                    return (
                      <li key={item.uid} className="fav-item">
                        <div className="fav-info">
                          <h4>{item.name}</h4>
                          <p>{item.brand} • {getCategoryName(item.category)}</p>
                        </div>
                        <div className="fav-actions">
                          <button className="btn" onClick={() => { setShowFavoritesModal(false); openDetail(item) }}>View</button>
                          <button className="btn" onClick={() => toggleFavorite(item.uid)}>Remove</button>
                          {bestVendor && (
                            <a className="btn primary" href={bestVendor.url} target="_blank" rel="noreferrer">
                              {formatPrice(getLowestPrice(item))}
                            </a>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="modal-container active" role="dialog" aria-modal="true">
          <div className="modal-overlay" onClick={() => setShowCompareModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>⚖️ Compare ({compareItems.length})</h2>
              <button className="modal-close-btn" onClick={() => setShowCompareModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {compareItems.length < 2 ? (
                <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  Select at least 2 items to compare. Use the ⚖️ button on product cards.
                </p>
              ) : (
                <div className="compare-wrap">
                  <table className="compare-table">
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        {compareItems.map(item => (
                          <th key={item.uid}>
                            <div style={{ marginBottom: 8 }}>{item.name}</div>
                            <button className="btn" onClick={() => toggleCompare(item.uid)}>Remove</button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Category</td>
                        {compareItems.map(item => <td key={item.uid}>{getCategoryName(item.category)}</td>)}
                      </tr>
                      <tr>
                        <td>Brand</td>
                        {compareItems.map(item => <td key={item.uid}>{item.brand}</td>)}
                      </tr>
                      <tr>
                        <td>Price</td>
                        {compareItems.map(item => <td key={item.uid}>{formatPrice(getLowestPrice(item))}</td>)}
                      </tr>
                      <tr>
                        <td>Vendors</td>
                        {compareItems.map(item => <td key={item.uid}>{item.vendors?.length || 0} available</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
