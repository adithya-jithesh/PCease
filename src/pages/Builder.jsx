import React, { useEffect, useMemo, useState } from 'react'
import '../styles/builder.css'
import {
  getComponentsStructured,
  getSavedBuilds,
  createSavedBuild,
  deleteSavedBuild,
  updateSavedBuild,
  getLowestPrice,
  getBestVendor,
  formatPrice,
  checkCompatibility,
  calculateBuildTotal
} from '../shared/api.js'
import { isLoggedIn, getToken } from '../lib/auth.js'

const categoryConfig = {
  cpu: { icon: '⚡', name: 'Processor' },
  motherboard: { icon: '🔌', name: 'Motherboard' },
  ram: { icon: '🧠', name: 'Memory' },
  gpu: { icon: '🎮', name: 'Graphics Card' },
  storage: { icon: '💾', name: 'Storage' },
  psu: { icon: '🔋', name: 'Power Supply' },
  pcCase: { icon: '📦', name: 'Case' },
  monitor: { icon: '🖥️', name: 'Monitor' }
}

function getCategoryIcon(cat) {
  return categoryConfig[cat]?.icon || '🔧'
}

function getCategoryName(cat) {
  return categoryConfig[cat]?.name || cat
}

export default function Builder() {
  const [db, setDb] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const grouped = await getComponentsStructured()
          if (mounted) setDb(grouped)
        } catch (e) {
          if (mounted) setError('Failed to load components')
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [])

  const categories = Object.keys(categoryConfig)
  const [currentBuild, setCurrentBuild] = useState(() => ({
    cpu: null, motherboard: null, ram: null, gpu: null,
    storage: null, psu: null, pcCase: null, monitor: null
  }))
  const [modal, setModal] = useState({ open: false, view: 'list', category: null, itemId: null })
  const [modalQuery, setModalQuery] = useState('')
  const [savedBuilds, setSavedBuilds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedBuilds') || '[]') } catch { return [] }
  })
  const loggedIn = isLoggedIn()

  // Load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const buildData = params.get('build')
    if (buildData) {
      try {
        const decoded = JSON.parse(atob(buildData))
        setCurrentBuild(decoded)
      } catch { }
    }
  }, [])

  // Load account saved builds
  useEffect(() => {
    let active = true
    if (!loggedIn) return
      ; (async () => {
        try {
          const token = getToken()
          const list = await getSavedBuilds(token)
          if (!active) return
          setSavedBuilds(list.map(b => ({ id: b._id, name: b.name, createdAt: b.createdAt, items: b.items })))
        } catch { }
      })()
    return () => { active = false }
  }, [loggedIn])

  // Compatibility check
  const compatibility = useMemo(() => checkCompatibility(currentBuild), [currentBuild])

  const selectedCount = Object.values(currentBuild).filter(Boolean).length
  const totalCount = Object.keys(currentBuild).length
  const totalPrice = calculateBuildTotal(currentBuild)

  const choose = (category) => { setModal({ open: true, view: 'list', category }); setModalQuery('') }
  const closeModal = () => setModal(m => ({ ...m, open: false }))
  const showDetail = (category, id) => setModal({ open: true, view: 'detail', category, itemId: id })

  const addToBuild = (category, id) => {
    const item = (db[category] || []).find(i => i.id === id)
    setCurrentBuild(b => ({ ...b, [category]: item }))
    setModal(m => ({ ...m, open: false }))
  }

  const clearBuild = () => setCurrentBuild({
    cpu: null, motherboard: null, ram: null, gpu: null,
    storage: null, psu: null, pcCase: null, monitor: null
  })

  const removeItem = (category) => setCurrentBuild(b => ({ ...b, [category]: null }))

  // Save/Load functions
  const saveBuild = async () => {
    const name = prompt('Name this build (e.g., "Budget Gaming")')?.trim()
    if (!name) return

    if (loggedIn) {
      try {
        const token = getToken()
        const safeItems = JSON.parse(JSON.stringify(currentBuild))
        const doc = await createSavedBuild({ name, items: safeItems, token })
        setSavedBuilds(list => [{ id: doc._id, name: doc.name, createdAt: doc.createdAt, items: doc.items }, ...list])
        alert('✅ Build saved to your account!')
      } catch (e) {
        alert('❌ Failed to save: ' + e.message)
      }
    } else {
      const id = Date.now()
      const entry = { id, name, createdAt: new Date().toISOString(), items: currentBuild }
      setSavedBuilds(list => {
        const next = [entry, ...list].slice(0, 50)
        try { localStorage.setItem('savedBuilds', JSON.stringify(next)) } catch { }
        return next
      })
      alert('✅ Build saved locally! Login to save to your account.')
    }
  }

  const loadBuild = () => {
    try {
      const s = localStorage.getItem('savedBuild')
      if (s) {
        if (confirm('Load last saved build?')) setCurrentBuild(JSON.parse(s))
      } else {
        alert('❌ No saved build found.')
      }
    } catch {
      alert('❌ Failed to load build.')
    }
  }

  const loadSavedById = (id) => {
    const entry = savedBuilds.find(b => b.id === id)
    if (!entry) return
    if (confirm(`Load "${entry.name}"?`)) setCurrentBuild(entry.items)
  }

  const deleteSaved = async (id) => {
    if (!confirm('Delete this build?')) return
    if (loggedIn) {
      try { await deleteSavedBuild({ id, token: getToken() }) } catch (e) { alert('❌ ' + e.message); return }
    } else {
      try {
        const data = savedBuilds.filter(b => b.id !== id)
        localStorage.setItem('savedBuilds', JSON.stringify(data))
      } catch { }
    }
    setSavedBuilds(list => list.filter(b => b.id !== id))
  }

  const renameSaved = async (id) => {
    const name = prompt('New name?')?.trim()
    if (!name) return
    if (loggedIn) {
      try {
        const doc = await updateSavedBuild({ id, name, token: getToken() })
        setSavedBuilds(list => list.map(b => b.id === id ? { ...b, name: doc.name } : b))
      } catch (e) { alert('❌ ' + e.message) }
    } else {
      setSavedBuilds(list => {
        const next = list.map(b => b.id === id ? { ...b, name } : b)
        try { localStorage.setItem('savedBuilds', JSON.stringify(next)) } catch { }
        return next
      })
    }
  }

  const exportBuild = () => {
    const parts = Object.entries(currentBuild)
      .filter(([_, item]) => item)
      .map(([cat, item]) => `${getCategoryName(cat)}: ${item.name} - ${formatPrice(getLowestPrice(item))}`)
    if (parts.length === 0) { alert('❌ No components selected.'); return }
    const text = `My PCease Build:\n\n${parts.join('\n')}\n\nTotal: ${formatPrice(totalPrice)}`
    navigator.clipboard.writeText(text).then(() => alert('✅ Copied to clipboard!'))
  }

  const shareBuild = () => {
    const encoded = btoa(JSON.stringify(currentBuild))
    const url = `${window.location.origin}/builder?build=${encoded}`
    navigator.clipboard.writeText(url).then(() => alert('✅ Share link copied!'))
  }

  if (loading) {
    return (
      <main className="container builder-page">
        <div className="builder-header">
          <h1>PC Builder</h1>
          <p>Loading components...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container builder-page">
        <div className="builder-header">
          <h1>PC Builder</h1>
          <p className="muted">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="container builder-page">
        <div className="builder-header">
          <h1>PC Builder</h1>
          <p>Select components to build your dream PC. We'll check compatibility as you go.</p>
        </div>

        <div className="builder-layout">
          {/* Component Picker */}
          <section className="component-picker">
            <div className="picker-toolbar">
              <h2>Choose Components</h2>
              <div className="picker-actions">
                <button className="action-btn" onClick={saveBuild}>💾 Save</button>
                <button className="action-btn" onClick={exportBuild}>📤 Export</button>
                <button className="action-btn" onClick={shareBuild}>🔗 Share</button>
              </div>
            </div>

            {/* Compatibility Warnings */}
            {compatibility.warnings.length > 0 && (
              <div className="warnings">
                {compatibility.warnings.map((w, i) => (
                  <div key={i} className="warning-card">
                    <span className="warning-icon">⚠️</span>
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Component Slots */}
            {categories.map(category => {
              const item = currentBuild[category]
              const hasItems = db[category]?.length > 0

              return (
                <div key={category} className={`component-slot ${item ? 'filled' : ''}`}>
                  <div className="slot-icon">{getCategoryIcon(category)}</div>
                  <div className="slot-info">
                    <h3>{getCategoryName(category)}</h3>
                    {item ? (
                      <p>
                        <span className="selected-name">{item.name}</span>
                        <span className="selected-price"> • {formatPrice(getLowestPrice(item))}</span>
                      </p>
                    ) : (
                      <p>Click to select a {getCategoryName(category).toLowerCase()}</p>
                    )}
                  </div>
                  <div className="slot-actions">
                    {hasItems && (
                      <button className="choose-btn" onClick={() => choose(category)}>
                        {item ? 'Change' : 'Choose'}
                      </button>
                    )}
                    {item && (
                      <button className="remove-btn" onClick={() => removeItem(category)} title="Remove">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </section>

          {/* Build Summary */}
          <aside className="build-summary">
            <div className="summary-header">
              <h2>Build Summary</h2>
            </div>
            <div className="summary-body">
              {/* Stats */}
              <div className="build-stats">
                <div className="stat-card">
                  <span className="stat-label">Components</span>
                  <span className="stat-value">{selectedCount}/{totalCount}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Status</span>
                  <span className={`stat-value ${compatibility.isCompatible ? 'compatible' : 'issues'}`}>
                    {selectedCount === 0 ? 'Empty' :
                      compatibility.hasWarnings ? 'Issues' :
                        selectedCount < totalCount ? 'Incomplete' : 'Ready!'}
                  </span>
                </div>
              </div>

              {/* Selected Items */}
              <div className="selected-items">
                {Object.entries(currentBuild).every(([_, v]) => !v) ? (
                  <div className="empty-build">
                    <div className="empty-build-icon">🖥️</div>
                    <p>Select components to start building</p>
                  </div>
                ) : (
                  Object.entries(currentBuild).map(([category, item]) => item && (
                    <div key={category} className="selected-item">
                      <div className="selected-item-info">
                        <strong>{getCategoryIcon(category)}</strong> {item.name}
                      </div>
                      <div className="selected-item-actions">
                        {(() => {
                          const vendor = getBestVendor(item)
                          return vendor ? (
                            <a className="buy-link" href={vendor.url} target="_blank" rel="noreferrer" title={`Buy at ${vendor.name}`}>
                              🛒
                            </a>
                          ) : null
                        })()}
                        <span>{formatPrice(getLowestPrice(item))}</span>
                        <button className="remove-item" onClick={() => removeItem(category)}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              <div className="total-section">
                <h3>{formatPrice(totalPrice)}</h3>
                <p className="total-note">Lowest in-stock prices</p>
              </div>

              {/* Actions */}
              <div className="summary-actions">
                <button className="summary-btn primary" onClick={saveBuild} disabled={selectedCount === 0}>
                  💾 Save Build
                </button>
                <button className="summary-btn secondary" onClick={loadBuild}>
                  📂 Load Build
                </button>
                <button className="summary-btn danger" onClick={clearBuild} disabled={selectedCount === 0}>
                  🗑️ Clear All
                </button>
              </div>

              {/* Saved Builds */}
              {savedBuilds.length > 0 && (
                <div className="saved-builds">
                  <h3>Saved Builds</h3>
                  <ul className="saved-list">
                    {savedBuilds.map(b => (
                      <li key={b.id} className="saved-item">
                        <span className="saved-item-name">{b.name}</span>
                        <span className="saved-item-date">{new Date(b.createdAt).toLocaleDateString()}</span>
                        <div className="saved-item-actions">
                          <button className="action-btn" onClick={() => loadSavedById(b.id)}>Load</button>
                          <button className="action-btn" onClick={() => renameSaved(b.id)}>Rename</button>
                          <button className="action-btn" onClick={() => deleteSaved(b.id)}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Modal */}
      {modal.open && (
        <div className="modal-container active" role="dialog" aria-modal="true">
          <div className="modal-overlay" onClick={closeModal}></div>
          <div className="modal-content">
            {modal.view === 'list' ? (
              <>
                <div className="modal-header">
                  <h2>Select {getCategoryName(modal.category)}</h2>
                  <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                </div>
                <div className="modal-search">
                  <input
                    type="search"
                    placeholder={`Search ${getCategoryName(modal.category)}...`}
                    value={modalQuery}
                    onChange={e => setModalQuery(e.target.value)}
                  />
                </div>
                <div className="modal-body">
                  <div className="component-list">
                    {(db[modal.category] || [])
                      .filter(i => {
                        const q = modalQuery.trim().toLowerCase()
                        if (!q) return true
                        return (
                          i.name?.toLowerCase().includes(q) ||
                          i.brand?.toLowerCase().includes(q)
                        )
                      })
                      .map(item => {
                        const price = getLowestPrice(item)
                        const inStock = price > 0
                        return (
                          <div
                            key={item.id}
                            className={`component-option ${!inStock ? 'disabled' : ''}`}
                            onClick={() => inStock && showDetail(modal.category, item.id)}
                          >
                            <h4>{item.name}</h4>
                            <strong>{inStock ? formatPrice(price) : 'Out of Stock'}</strong>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h2>{(db[modal.category] || []).find(i => i.id === modal.itemId)?.name}</h2>
                  <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                </div>
                <div className="modal-body">
                  <button className="btn-ghost" onClick={() => setModal(m => ({ ...m, view: 'list' }))}>
                    ← Back to list
                  </button>
                  <ul className="vendor-list">
                    {(db[modal.category] || []).find(i => i.id === modal.itemId)?.vendors.map((v, i) => (
                      <li key={i} className="vendor-item">
                        <div className="vendor-info">
                          <a className="vendor-name" href={v.url} target="_blank" rel="noreferrer">
                            {v.name} ↗
                          </a>
                          <span className={`stock-badge ${v.inStock || v.stock ? 'in-stock' : 'out-of-stock'}`}>
                            {v.inStock || v.stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <span className="vendor-price">{formatPrice(v.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="add-btn"
                    onClick={() => addToBuild(modal.category, modal.itemId)}
                    disabled={!getLowestPrice((db[modal.category] || []).find(i => i.id === modal.itemId))}
                  >
                    Add to Build • {formatPrice(getLowestPrice((db[modal.category] || []).find(i => i.id === modal.itemId)))}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
