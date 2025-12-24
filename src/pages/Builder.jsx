import React, { useEffect, useMemo, useState } from 'react'
import '../styles/builder.css'
import { getComponentsStructured, getSavedBuilds, createSavedBuild, deleteSavedBuild, updateSavedBuild } from '../shared/api.js'
import { isLoggedIn, getToken } from '../lib/auth.js'

function getCheapestVendor(component){
  if (!component?.vendors?.length) return null
  const inStock = component.vendors.filter(v => v.stock)
  const list = inStock.length ? inStock : component.vendors
  return list.reduce((min, v) => v.price < min.price ? v : min, list[0])
}
function lowestPrice(component){
  const inStock = component?.vendors?.filter(v => v.stock) || []
  if (inStock.length===0) return 0
  return Math.min(...inStock.map(v=>v.price))
}
function displayName(category){ return category.replace('pcCase','Case & Fans') }

export default function Builder(){
  const [db, setDb] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try{ const grouped = await getComponentsStructured(); if(mounted) setDb(grouped) }
      catch(e){ if(mounted) setError('Failed to load components') }
      finally{ if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[])
  const categories = Object.keys(db)
  const [currentBuild, setCurrentBuild] = useState(()=>({ cpu:null, motherboard:null, ram:null, gpu:null, storage:null, psu:null, pcCase:null, monitor:null }))
  const [modal, setModal] = useState({ open:false, view:'list', category:null, itemId:null })
  const [modalQuery, setModalQuery] = useState('')
  const [savedBuilds, setSavedBuilds] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('savedBuilds')||'[]') }catch{ return [] }
  })
  const loggedIn = isLoggedIn()

  // load from URL
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const buildData = params.get('build')
    if (buildData) {
      try { const decoded = JSON.parse(atob(buildData)); setCurrentBuild(decoded) } catch {}
    }
  }, [])

  // Load account saved builds if logged in
  useEffect(()=>{
    let active = true
    if (!loggedIn) return
    ;(async()=>{
      try{
        const token = getToken()
        const list = await getSavedBuilds(token)
        if (!active) return
        // Map _id to id for UI consistency
        setSavedBuilds(list.map(b=>({ id: b._id, name: b.name, createdAt: b.createdAt, items: b.items })))
      }catch(e){ /* ignore for UI */ }
    })()
    return ()=>{ active = false }
  }, [loggedIn])

  const warnings = useMemo(()=>{
    const w = []
    const { cpu, motherboard, ram, pcCase } = currentBuild
    if (cpu && motherboard && cpu.brand && motherboard.brand && cpu.brand !== motherboard.brand) {
      w.push(`CPU brand (${cpu.brand}) doesn't match motherboard brand (${motherboard.brand})`)
    }
    if (ram && motherboard && ram.ramType && motherboard.ramType && ram.ramType !== motherboard.ramType) {
      w.push(`RAM type (${ram.ramType}) doesn't match motherboard (${motherboard.ramType})`)
    }
    if (pcCase && motherboard && pcCase.formFactor && motherboard.formFactor && pcCase.formFactor !== motherboard.formFactor) {
      w.push(`Case form factor (${pcCase.formFactor}) doesn't match motherboard (${motherboard.formFactor})`)
    }
    return w
  }, [currentBuild])

  const selectedCount = Object.values(currentBuild).filter(Boolean).length
  const totalCount = Object.keys(currentBuild).length
  const totalPrice = Object.values(currentBuild).filter(Boolean).reduce((sum, item)=> sum + lowestPrice(item), 0)

  const choose = (category) => { setModal({ open:true, view:'list', category }); setModalQuery('') }
  const closeModal = () => setModal(m => ({...m, open:false}))
  const showDetail = (category, id) => setModal({ open:true, view:'detail', category, itemId:id })
  const addToBuild = (category, id) => {
    const item = (db[category]||[]).find(i => i.id === id)
    setCurrentBuild(b => ({...b, [category]: item}))
    setModal(m => ({...m, open:false}))
  }
  const clearBuild = () => setCurrentBuild({ cpu:null, motherboard:null, ram:null, gpu:null, storage:null, psu:null, pcCase:null, monitor:null })
  const removeItem = (category) => setCurrentBuild(b=> ({...b, [category]: null}))

  // toolbar actions
  const saveBuild = async () => {
    const name = prompt('Name this build (e.g., "Budget 1080p Gaming")')?.trim()
    if (!name) return
    if (loggedIn){
      try{
        const token = getToken()
        // Deep-clone to ensure plain JSON
        const safeItems = JSON.parse(JSON.stringify(currentBuild))
        const doc = await createSavedBuild({ name, items: safeItems, token })
        setSavedBuilds(list => [{ id: doc._id, name: doc.name, createdAt: doc.createdAt, items: doc.items }, ...list])
        alert('✅ Build saved to your account!')
      }catch(e){ alert('❌ Failed to save build: ' + e.message) }
    } else {
      const id = Date.now()
      const entry = { id, name, createdAt: new Date().toISOString(), items: currentBuild }
      setSavedBuilds(list => {
        const next = [entry, ...list].slice(0,50)
        try{ localStorage.setItem('savedBuilds', JSON.stringify(next)) }catch{}
        return next
      })
      try { localStorage.setItem('savedBuild', JSON.stringify(currentBuild)) } catch {}
      alert('✅ Build saved locally! Login to save to your account.')
    }
  }
  const loadBuild = () => {
    try{ const s = localStorage.getItem('savedBuild'); if(s){ if(confirm('Load last saved build? This will replace your current build.')) setCurrentBuild(JSON.parse(s)) } else alert('❌ No saved build found.') } catch { alert('❌ Failed to load build.') }
  }
  const loadSavedById = (id) => {
    const entry = savedBuilds.find(b=>b.id===id)
    if (!entry) return
    if (confirm(`Load build "${entry.name}"? This will replace your current build.`)) setCurrentBuild(entry.items)
  }
  const deleteSaved = async (id) => {
    if (!confirm('Delete this saved build?')) return
    if (loggedIn){
      try{ await deleteSavedBuild({ id, token: getToken() }) }catch(e){ alert('❌ ' + e.message); return }
    } else {
      try{ const data = savedBuilds.filter(b=>b.id!==id); localStorage.setItem('savedBuilds', JSON.stringify(data)) }catch{}
    }
    setSavedBuilds(list => list.filter(b=>b.id!==id))
  }
  const renameSaved = async (id) => {
    const name = prompt('New name for this build?')?.trim()
    if (!name) return
    if (loggedIn){
      try{ const doc = await updateSavedBuild({ id, name, token: getToken() }); setSavedBuilds(list => list.map(b=> b.id===id ? { ...b, name: doc.name } : b)) }
      catch(e){ alert('❌ ' + e.message) }
    } else {
      setSavedBuilds(list => {
        const next = list.map(b=> b.id===id ? {...b, name} : b)
        try{ localStorage.setItem('savedBuilds', JSON.stringify(next)) }catch{}
        return next
      })
    }
  }
  const exportBuild = () => {
    const parts = Object.entries(currentBuild).filter(([_,item])=>item).map(([cat,item])=>`${displayName(cat)}: ${item.name} - ₹${lowestPrice(item).toLocaleString('en-IN')}`)
    if (parts.length===0) { alert('❌ No components selected to export.'); return }
    const text = `My PC Build from PCease:\n\n${parts.join('\n')}\n\nTotal: ₹${totalPrice.toLocaleString('en-IN')}`
    navigator.clipboard.writeText(text).then(()=>alert('✅ Build exported to clipboard!')).catch(()=>alert(text))
  }
  const shareBuild = () => {
    const encoded = btoa(JSON.stringify(currentBuild))
    const url = `${window.location.origin}/builder?build=${encoded}`
    navigator.clipboard.writeText(url).then(()=>alert('✅ Share link copied to clipboard!')).catch(()=>prompt('Copy this URL to share your build:', url))
  }

  const isCompatible = (category, item) => {
    const { cpu, motherboard, pcCase } = currentBuild
    if (category==='motherboard' && cpu && item.brand && cpu.brand && item.brand!==cpu.brand) return false
    if (category==='cpu' && motherboard && item.brand && motherboard.brand && item.brand!==motherboard.brand) return false
    if (category==='ram' && motherboard && item.ramType && motherboard.ramType && item.ramType!==motherboard.ramType) return false
    if (category==='pcCase' && motherboard && item.formFactor && motherboard.formFactor && item.formFactor!==motherboard.formFactor) return false
    if (category==='motherboard' && pcCase && item.formFactor && pcCase.formFactor && item.formFactor!==pcCase.formFactor) return false
    return true
  }

  return (
    <>
      <main className="main-content container">
        <section id="component-picker" className="component-picker" aria-label="Component selection">
          <div className="builder-header">
            <h2>Choose Your Components</h2>
            <div className="builder-toolbar">
              <button className="toolbar-btn" onClick={saveBuild}>💾 Save Build</button>
              <button className="toolbar-btn" onClick={loadBuild}>📂 Load Build</button>
              <button className="toolbar-btn" onClick={exportBuild}>📤 Export</button>
              <button className="toolbar-btn" onClick={shareBuild}>🔗 Share</button>
            </div>
          </div>
          <div id="compatibility-warnings" className="compatibility-warnings">
            {warnings.map((w,i)=> (
              <div key={i} className="warning-item"><span className="warning-icon">⚠️</span><span>{w}</span></div>
            ))}
          </div>

          {categories.map(category => {
            const item = currentBuild[category]
            const priceInfo = item ? ` - ₹${lowestPrice(item).toLocaleString('en-IN')}` : ''
            return (
              <div key={category} className="component-slot">
                <div className="component-slot-info">
                  <h3>{displayName(category)}</h3>
                  <p>{item ? `${item.name}${priceInfo}` : 'Not selected'}</p>
                </div>
                <button className="choose-btn" onClick={()=>choose(category)}>{item ? 'Change' : 'Choose'}</button>
              </div>
            )
          })}
        </section>

        <aside id="current-build" className="current-build" aria-label="Current build summary">
          <h2>Your Current Build</h2>
          <div className="build-stats">
            <div className="stat-item"><span className="stat-label">Components:</span><span id="component-count" className="stat-value">{selectedCount}/{totalCount}</span></div>
            <div className="stat-item"><span className="stat-label">Status:</span>
              <span id="compatibility-status" className={"stat-value "+(selectedCount===0 ? 'status-unknown' : warnings.length>0 ? 'status-issues' : selectedCount<totalCount ? 'status-unknown' : 'status-compatible')}>
                {selectedCount===0 ? 'Empty' : warnings.length>0 ? 'Issues Found' : selectedCount<totalCount ? 'Incomplete' : 'Compatible!'}
              </span>
            </div>
          </div>

          <div id="build-items" role="list">
            {Object.entries(currentBuild).every(([_,v])=>!v) ? <p>Select parts to begin.</p> : (
              Object.entries(currentBuild).map(([category, item]) => item && (
                <div key={category} className="selected-item">
                  <span><strong>{displayName(category)}:</strong> {item.name}</span>
                  <span>{(() => { const buy = getCheapestVendor(item); return buy ? <a className="buy-now-btn" href={buy.url} target="_blank" rel="noreferrer" title={`Buy at ${buy.name}`}>🛒</a> : null })()} ₹{lowestPrice(item).toLocaleString('en-IN')} <button className="remove-item-btn" onClick={()=>removeItem(category)} aria-label={`Remove ${displayName(category)}`}>×</button></span>
                </div>
              ))
            )}
          </div>
          <div className="total-price"><h3 id="total-price">Total: ₹{totalPrice.toLocaleString('en-IN')}</h3><p className="price-note">Lowest in-stock prices shown</p></div>
          <button id="clear-build" className="clear-build-btn" onClick={clearBuild}>Clear Build</button>

          {loggedIn && (
          <div className="saved-builds">
            <div className="section-header"><h3>Saved Builds</h3></div>
            {savedBuilds.length===0 ? (
              <p className="empty-note">No saved builds yet. Save your current build to add it here.</p>
            ) : (
              <ul className="saved-builds-list">
                {savedBuilds.map(b => (
                  <li key={b.id} className="saved-build-item">
                    <div className="saved-build-meta">
                      <strong className="saved-build-name">{b.name}</strong>
                      <span className="saved-build-date">{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="saved-build-actions">
                      <button className="toolbar-btn" onClick={()=>loadSavedById(b.id)}>Load</button>
                      <button className="toolbar-btn" onClick={()=>renameSaved(b.id)}>Rename</button>
                      <button className="toolbar-btn" onClick={()=>deleteSaved(b.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}
        </aside>
      </main>

      {modal.open && (
        <div id="modal-container" className="modal-container active" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-overlay" onClick={closeModal}></div>
          <div className="modal-content">
            {modal.view==='list' ? (
              <>
                <div id="modal-header" className="modal-header">
                  <h2>Select a {displayName(modal.category)}</h2>
                  <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                </div>
                <div className="modal-search-row" style={{padding:'8px 0 12px', display:'flex', gap:'8px'}}>
                  <input
                    type="search"
                    placeholder={`Search ${displayName(modal.category)}...`}
                    value={modalQuery}
                    onChange={e=>setModalQuery(e.target.value)}
                    aria-label="Search in list"
                    style={{flex:1}}
                  />
                </div>
                <div id="modal-body" className="modal-body">
                  {(db[modal.category]||[])
                    .filter(i=>{
                      const q = modalQuery.trim().toLowerCase()
                      if(!q) return true
                      return (
                        i.name?.toLowerCase().includes(q) ||
                        i.brand?.toLowerCase().includes(q) ||
                        i.memory?.toLowerCase().includes(q) ||
                        i.capacity?.toLowerCase().includes(q)
                      )
                    })
                    .map(item => {
                    const inStock = item.vendors.some(v=>v.stock)
                    const compatible = isCompatible(modal.category, item)
                    const priceText = inStock ? `From ₹${lowestPrice(item).toLocaleString('en-IN')}` : 'Out of Stock'
                    return (
                      <div key={item.id} className={"component-card "+((!inStock || !compatible) ? 'disabled' : '')} onClick={()=> (inStock && compatible) && showDetail(modal.category, item.id)}>
                        <div><h4>{item.name}</h4></div>
                        <strong>{priceText}</strong>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div id="modal-header" className="modal-header">
                  <button className="modal-back-btn" onClick={()=>setModal(m=>({...m, view:'list'}))}>&larr;</button>
                  <h2>{(db[modal.category]||[]).find(i=>i.id===modal.itemId)?.name}</h2>
                  <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                </div>
                <div id="modal-body" className="modal-body">
                  <ul className="vendor-list">
                    {(db[modal.category]||[]).find(i=>i.id===modal.itemId)?.vendors.map((v,i)=> (
                      <li key={i} className="vendor-item">
                        <div className="vendor-info">
                          <a className="vendor-link" href={v.url} target="_blank" rel="noreferrer">{v.name} ⇗</a>
                          <span className={"stock-status "+(v.stock?'in-stock':'out-of-stock')}>{v.stock ? 'In Stock' : 'Out of Stock'}</span>
                        </div>
                        <span>₹{v.price.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="detail-view-footer">
                    {(db[modal.category]||[]).find(i=>i.id===modal.itemId)?.vendors.some(v=>v.stock) ? (
                      <button className="add-to-build-btn" onClick={()=>addToBuild(modal.category, modal.itemId)}>Add to Build for ₹{lowestPrice((db[modal.category]||[]).find(i=>i.id===modal.itemId)).toLocaleString('en-IN')}</button>
                    ) : (
                      <button className="add-to-build-btn" disabled>Out of Stock</button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
