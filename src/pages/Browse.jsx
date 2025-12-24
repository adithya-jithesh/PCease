import { useEffect, useMemo, useState } from 'react'
import { getComponentsStructured } from '../shared/api.js'
import '../styles/browse.css'

function transformDB(db){
  const all = []
  for (const [category, items] of Object.entries(db)){
    for (const item of items){
      const avgPrice = item.vendors?.length ? Math.round(item.vendors.reduce((s,v)=>s+v.price,0)/item.vendors.length) : 0
      all.push({
        // create a unique id per category so keys are stable even if numeric ids repeat across categories
        uid: `${category}-${item.id}`,
        id: item.id,
        name: item.name,
        category,
        brand: item.brand || 'Generic',
        price: avgPrice,
        vendors: item.vendors || [],
        ramType: item.ramType,
        formFactor: item.formFactor,
        cores: item.cores,
        memory: item.memory,
        capacity: item.capacity,
        wattage: item.wattage,
        socket: item.socket
      })
    }
  }
  return all
}

function getCategoryName(cat){
  const names = { cpu:'Processor', gpu:'Graphics Card', motherboard:'Motherboard', ram:'Memory (RAM)', storage:'Storage', psu:'Power Supply', pcCase:'Case', monitor:'Monitor' }
  if (cat==='all') return 'All'
  return names[cat] || cat?.toUpperCase()
}

function getCheapestVendor(component){
  if (!component?.vendors?.length) return null
  const inStock = component.vendors.filter(v=>v.stock)
  const list = inStock.length ? inStock : component.vendors
  return list.reduce((min,v)=> v.price < min.price ? v : min, list[0])
}

export default function Browse(){
  const [db, setDb] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let active = true
    ;(async()=>{
      try{ const grouped = await getComponentsStructured(); if(active) setDb(grouped) }
      catch{ if(active) setError('Failed to load components') }
      finally{ if(active) setLoading(false) }
    })()
    return ()=>{ active = false }
  }, [])

  const all = useMemo(()=>transformDB(db), [db])
  const brands = useMemo(()=>[...new Set(all.map(c=>c.brand).filter(Boolean))].sort(), [all])
  const categories = useMemo(()=>['all', ...new Set(all.map(c=>c.category))], [all])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [favorites, setFavorites] = useState(()=> JSON.parse(localStorage.getItem('favorites')||'[]')||[])
  const [compareList, setCompareList] = useState(()=> JSON.parse(localStorage.getItem('compareList')||'[]')||[])
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [detail, setDetail] = useState({ open:false, item:null })

  useEffect(()=>{ localStorage.setItem('favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(()=>{ localStorage.setItem('compareList', JSON.stringify(compareList)) }, [compareList])

  const results = useMemo(()=>{
    let r = [...all]
    const q = search.trim().toLowerCase()
    if (q) r = r.filter(i => i.name.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q))
    if (category !== 'all') r = r.filter(i => i.category === category)
    if (brand) r = r.filter(i => i.brand === brand)
    if (minPrice!=='') r = r.filter(i => i.price >= Number(minPrice))
    if (maxPrice!=='') r = r.filter(i => i.price <= Number(maxPrice))
    return r.sort((a,b)=> a.price-b.price)
  }, [all, search, category, brand, minPrice, maxPrice])

  const openDetail = (item) => setDetail({ open:true, item })
  const closeDetail = () => setDetail({ open:false, item:null })
  const toggleFavorite = (uid) => setFavorites(list => list.includes(uid) ? list.filter(x=>x!==uid) : [...list, uid])
  const toggleCompare = (uid) => setCompareList(list => list.includes(uid) ? list.filter(x=>x!==uid) : (list.length>=3 ? list : [...list, uid]))

  const findByUid = (uid) => all.find(i => i.uid === uid || String(i.id) === String(uid))
  const favoriteItems = favorites.map(findByUid).filter(Boolean)
  const compareItems = compareList.map(findByUid).filter(Boolean)

  if (loading) return (
    <main className="container"><header className="page-header"><h1>Browse Components</h1><p>Loading components…</p></header></main>
  )
  if (error) return <main className="container"><header className="page-header"><h1>Browse Components</h1><p style={{color:'var(--muted)'}}>{error}</p></header></main>

  return (
    <main className="container">
      <header className="page-header">
        <h1>Browse Components</h1>
        <p>Find the right part by category, brand, and price, then compare or buy from listed vendors.</p>
      </header>

      {/* Centered toolbar under header: Favorites and Compare buttons side-by-side */}
      <div className="toolbar-row">
        <div className="toolbar">
          <button className="toolbar-btn" onClick={()=>setShowFavoritesModal(true)} aria-haspopup="dialog">
            Favorites {favorites.length>0 && <span className="count">{favorites.length}</span>}
          </button>
          <button className="toolbar-btn" onClick={()=>setShowCompareModal(true)} aria-haspopup="dialog" disabled={compareList.length===0}>
            Compare {compareList.length>0 && <span className="count">{compareList.length}</span>}
          </button>
        </div>
      </div>

      <section className="controls">
        <input className="control-input" type="search" placeholder="Search by name or brand…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="row">
          <div className="chips" role="toolbar" aria-label="Filter by category">
            {categories.map(c => (
              <button key={c} className={"chip "+(c===category?'active':'')} onClick={()=>setCategory(c)}>{getCategoryName(c)}</button>
            ))}
          </div>
          <div className="filters">
            <select className="control-select" value={brand} onChange={e=>setBrand(e.target.value)}>
              <option value="">All brands</option>
              {brands.map(b=> <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="price">
              <input className="control-number" type="number" placeholder="Min ₹" min="0" value={minPrice} onChange={e=>setMinPrice(e.target.value)} />
              <span>—</span>
              <input className="control-number" type="number" placeholder="Max ₹" min="0" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} />
            </div>
            <button className="clear" onClick={()=>{ setSearch(''); setCategory('all'); setBrand(''); setMinPrice(''); setMaxPrice('') }}>Clear</button>
          </div>
        </div>
      </section>

      <section className="grid">
        {results.length===0 ? <p className="muted">No components match your filters.</p> : results.map(item => {
          const cheapest = getCheapestVendor(item)
          // support both legacy numeric ids and new per-category uid values stored in localStorage
          const uid = item.uid || `${item.category}-${item.id}`
          const fav = favorites.includes(uid) || favorites.includes(item.id)
          const inCmp = compareList.includes(uid) || compareList.includes(item.id)
          return (
            <article key={uid} className="card">
              <div className="card-top">
                <span className="badge">{getCategoryName(item.category)}</span>
                <div className="icons">
                  <button className={"icon "+(fav?'active':'')} title="Favorite" onClick={()=>toggleFavorite(uid)}>{fav ? '⭐' : '☆'}</button>
                  <button className={"icon "+(inCmp?'active':'')} title="Compare" onClick={()=>toggleCompare(uid)} disabled={!inCmp && compareList.length>=3}>{inCmp ? '✓' : '⚖️'}</button>
                </div>
              </div>
              <h3 className="title" title={item.name}>{item.name}</h3>
              {cheapest ? <div className="price">From ₹{cheapest.price.toLocaleString('en-IN')}</div> : <div className="price muted">No offers</div>}
              <div className="actions">
                <button className="btn" onClick={()=>openDetail(item)}>View Details</button>
                {cheapest && <a className="btn primary" href={cheapest.url} target="_blank" rel="noreferrer">Buy</a>}
              </div>
            </article>
          )
        })}
      </section>

      {detail.open && detail.item && (
        <div className="modal-container active" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <div className="modal-overlay" onClick={closeDetail}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="detail-title">{detail.item.name}</h2>
              <button className="modal-close-btn" onClick={closeDetail}>&times;</button>
            </div>
            <div className="modal-body two-col">
              <div className="col">
                <div className="meta">
                  <span className="badge">{getCategoryName(detail.item.category)}</span>
                  <span className="muted">{detail.item.brand}</span>
                </div>
                <ul className="specs">
                  {detail.item.cores ? <li><strong>Cores:</strong> {detail.item.cores}</li> : null}
                  {detail.item.memory ? <li><strong>Memory:</strong> {detail.item.memory}</li> : null}
                  {detail.item.capacity ? <li><strong>Capacity:</strong> {detail.item.capacity}</li> : null}
                  {detail.item.wattage ? <li><strong>Wattage:</strong> {detail.item.wattage}W</li> : null}
                  {detail.item.formFactor ? <li><strong>Form Factor:</strong> {detail.item.formFactor}</li> : null}
                  {detail.item.ramType ? <li><strong>RAM Type:</strong> {detail.item.ramType}</li> : null}
                </ul>
              </div>
              <div className="col">
                {detail.item.vendors?.length ? (
                  <ul className="vendor-list">
                    {detail.item.vendors.map((v,i)=> (
                      <li key={i} className="vendor-item">
                        <a className="vendor-link" href={v.url} target="_blank" rel="noreferrer">{v.name}</a>
                        <span className={"stock-status "+(v.stock?'in-stock':'out-of-stock')}>{v.stock ? 'In Stock' : 'Out of Stock'}</span>
                        <span className="vendor-price">₹{v.price.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted">No vendors listed.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites modal */}
      {showFavoritesModal && (
        <div className="modal-container active" role="dialog" aria-modal="true" aria-labelledby="favorites-title">
          <div className="modal-overlay" onClick={()=>setShowFavoritesModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="favorites-title">Favorites</h2>
              <button className="modal-close-btn" onClick={()=>setShowFavoritesModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {favoriteItems.length===0 ? (
                <p className="muted">No favorites yet. Click the star on any card to save it here.</p>
              ) : (
                <ul className="fav-list">
                  {favoriteItems.map(it => (
                    <li key={it.uid} className="fav-item">
                      <div className="fav-meta">
                        <strong>{it.name}</strong>
                        <span className="muted">{it.brand} — {getCategoryName(it.category)}</span>
                      </div>
                      <div className="fav-actions">
                        <button className="btn" onClick={()=>{ setShowFavoritesModal(false); openDetail(it) }}>View</button>
                        <button className="btn" onClick={()=>toggleFavorite(it.uid)}>Remove</button>
                        {getCheapestVendor(it) && <a className="btn primary" href={getCheapestVendor(it).url} target="_blank" rel="noreferrer">Buy</a>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare modal (table) */}
      {showCompareModal && (
        <div className="modal-container active" role="dialog" aria-modal="true" aria-labelledby="compare-title">
          <div className="modal-overlay" onClick={()=>setShowCompareModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="compare-title">Compare ({compareItems.length})</h2>
              <button className="modal-close-btn" onClick={()=>setShowCompareModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {compareItems.length<2 ? (
                <p className="muted">Select at least two items to compare. Use the ⚖️ button on cards to add them.</p>
              ) : (
                <div className="compare-table-wrap">
                  <table className="compare-table">
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        {compareItems.map(it => (
                          <th key={it.uid}>
                            <div className="cmp-col-head">
                              <div className="cmp-title">{it.name}</div>
                              <div className="cmp-sub">{it.brand}</div>
                              <button className="small-link" onClick={()=>toggleCompare(it.uid)}>Remove</button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Category</td>
                        {compareItems.map(it=> <td key={it.uid}>{getCategoryName(it.category)}</td>)}
                      </tr>
                      <tr>
                        <td>Brand</td>
                        {compareItems.map(it=> <td key={it.uid}>{it.brand}</td>)}
                      </tr>
                      <tr>
                        <td>Price (cheapest)</td>
                        {compareItems.map(it=> {
                          const v = getCheapestVendor(it)
                          return <td key={it.uid}>{v ? `₹${v.price.toLocaleString('en-IN')}` : '—'}</td>
                        })}
                      </tr>
                      <tr>
                        <td>Specs</td>
                        {compareItems.map(it=> (
                          <td key={it.uid}>
                            <div className="specs-compact">
                              {it.cores ? <div><strong>Cores:</strong> {it.cores}</div> : null}
                              {it.memory ? <div><strong>Memory:</strong> {it.memory}</div> : null}
                              {it.capacity ? <div><strong>Capacity:</strong> {it.capacity}</div> : null}
                              {it.wattage ? <div><strong>Wattage:</strong> {it.wattage}W</div> : null}
                              {it.formFactor ? <div><strong>Form:</strong> {it.formFactor}</div> : null}
                              {it.ramType ? <div><strong>RAM:</strong> {it.ramType}</div> : null}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>Vendors</td>
                        {compareItems.map(it=> (
                          <td key={it.uid}>
                            {it.vendors?.length ? (
                              <ul className="vendor-compact">
                                {it.vendors.map((v,i)=> (
                                  <li key={i}><a href={v.url} target="_blank" rel="noreferrer">{v.name}</a> — ₹{v.price.toLocaleString('en-IN')} {v.stock? <span className="muted">(In stock)</span> : <span className="muted">(OOS)</span>}</li>
                                ))}
                              </ul>
                            ) : 'No offers'}
                          </td>
                        ))}
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
