import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getComponentsStructured } from '../shared/api.js'
import '../styles/query.css'

function buildAllComponents(db){
  const all = []
  Object.entries(db).forEach(([category, items]) => {
    items.forEach(item => {
      const inStock = (item.vendors || []).filter(v => v.stock)
      const price = inStock.length>0 ? Math.min(...inStock.map(v=>v.price)) : ((item.vendors||[])[0]?.price || 0)
      all.push({
        id: item.id,
        name: item.name,
        category,
        brand: item.brand,
        ramType: item.ramType,
        formFactor: item.formFactor,
        cores: item.cores,
        memory: item.memory,
        capacity: item.capacity,
        wattage: item.wattage,
        price,
        vendors: item.vendors || []
      })
    })
  })
  return all
}
function byId(all, id){ return all.find(c => c.id === id) || null }
function getCategoryDisplayName(category){
  const names = { cpu:'Processor', gpu:'Graphics Card', motherboard:'Motherboard', ram:'Memory (RAM)', storage:'Storage', psu:'Power Supply', pcCase:'Case', monitor:'Monitor' }
  return names[category] || category.toUpperCase()
}
function getComponentSpecs(component){
  const specs = []
  if (component.cores) specs.push(`${component.cores} cores`)
  if (component.memory) specs.push(`${component.memory}`)
  if (component.capacity) specs.push(`${component.capacity}`)
  if (component.wattage) specs.push(`${component.wattage}W`)
  if (component.formFactor) specs.push(component.formFactor)
  return (specs.slice(0,3).join(' • ')) || ''
}
function getCheapestVendor(component){
  if (!component?.vendors?.length) return null
  const inStock = component.vendors.filter(v=>v.stock)
  const list = inStock.length ? inStock : component.vendors
  return list.reduce((min,v)=> v.price < min.price ? v : min, list[0])
}

export default function Query(){
  const navigate = useNavigate()
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
  const allComponents = useMemo(()=>buildAllComponents(db), [db])

  const [budget, setBudget] = useState(80000)
  const [useCase, setUseCase] = useState('')
  const [performanceLevel, setPerformanceLevel] = useState('mid-range')
  const [brandPreference, setBrandPreference] = useState('')
  

  const [currentBuild, setCurrentBuild] = useState(null)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [exporting, setExporting] = useState(false)

  const minBudget = 20000, maxBudget = 500000
  const sliderPercent = ((budget - minBudget) / (maxBudget - minBudget)) * 100
  const sliderBg = { background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${sliderPercent}%, var(--border) ${sliderPercent}%)` }

  const presets = [
    { id: 'budget-50k',  title: '₹50K Balanced', icon: '💸', desc: 'Entry-level general use', budget: 50000, useCase: 'general' },
    { id: 'budget-75k',  title: '₹75K Gaming',   icon: '🎮', desc: '1080p gaming starter',   budget: 75000, useCase: 'gaming' },
    { id: 'budget-1l',   title: '₹1L Gaming',    icon: '⚡', desc: '1080p/1440p capable',     budget: 100000, useCase: 'gaming' },
    { id: 'budget-1_5l', title: '₹1.5L Mid-High',icon: '🥈', desc: 'Strong 1440p gaming',     budget: 150000, useCase: 'gaming' },
    { id: 'budget-2l',   title: '₹2L Creator',   icon: '🎬', desc: 'Content creation focus',  budget: 200000, useCase: 'content-creation' },
    { id: 'budget-3l',   title: '₹3L High-End',  icon: '💎', desc: 'High-end 1440p/4K',      budget: 300000, useCase: 'gaming' },
    { id: 'budget-4l',   title: '₹4L Enthusiast',icon: '🚀', desc: 'Enthusiast-grade setup',  budget: 400000, useCase: 'workstation' },
    { id: 'budget-5l',   title: '₹5L Ultimate',  icon: '🏆', desc: 'No-compromise build',     budget: 500000, useCase: 'workstation' },

    { id: 'mid-gaming-amd', title: 'Mid Gaming (AMD)', icon: '🎮', desc: '1080p/1440p ready, great value',
      parts: { cpu: 2, gpu: 13, motherboard: 3, ram: 10, storage: 15, psu: 19, pcCase: 20, monitor: 38 } },
    { id: 'high-end-gaming', title: 'High-End Gaming', icon: '💎', desc: '4080-class 1440p/4K gaming',
      parts: { cpu: 3, gpu: 31, motherboard: 4, ram: 9, storage: 15, psu: 18, pcCase: 37, monitor: 23 } }
  ]
  const isBudgetPreset = (p)=> typeof p.budget === 'number' && !p.parts
  const countFilledParts = (parts)=> Object.values(parts).filter(Boolean).length
  const totalPriceFromParts = (parts)=> Object.entries(parts).reduce((sum,[cat,id])=>{ const comp = byId(allComponents,id); return sum + (comp?.price||0)},0)

  function applyPreset(p){
    const build = {}
    Object.entries(p.parts).forEach(([cat,id])=>{ const comp = byId(allComponents,id); if (comp) build[cat]=comp })
    setCurrentBuild(build)
    setUseCase(p.title)
    setResultsVisible(true)
  }
  function applyBudgetPreset(p){
    generateBuildRecommendation({
      budget: p.budget,
      useCase: p.useCase || 'general',
      performanceLevel: 'preset',
      brandPreference: p.brandPreference || ''
    })
  }

  // Candidates builder per category with compatibility filters applied, sorted by ascending price
  function getCandidates(category, build, brandPref){
    const base = allComponents.filter(c => c.category === category && c.price && c.price > 0)
    const cpuBrand = (build.cpu?.brand) || brandPref || ''
    const mbRamType = build.motherboard?.ramType || ''
    const mbForm = build.motherboard?.formFactor || ''
    let filtered = base
    if (category === 'cpu' && brandPref){ filtered = base.filter(c => c.brand === brandPref) }
    if (category === 'motherboard'){ filtered = base.filter(c => !cpuBrand || c.brand === cpuBrand) }
    if (category === 'ram'){ filtered = base.filter(c => !mbRamType || c.ramType === mbRamType) }
    if (category === 'pcCase'){ filtered = base.filter(c => !mbForm || c.formFactor === mbForm) }
    return filtered.sort((a,b)=>a.price-b.price)
  }

  // Pick the most expensive option under or equal to target; if none, pick the cheapest
  function pickUnderOrClosest(sortedList, target){
    if (!sortedList || sortedList.length===0) return null
    let candidate = null
    for (let i=0;i<sortedList.length;i++){
      if (sortedList[i].price <= target) candidate = sortedList[i]
      else break
    }
    return candidate || sortedList[0]
  }

  function generateBuildRecommendation(query){
    const { budget, useCase, brandPreference } = query
    const allocationProfiles = {
      gaming: { cpu: 0.2, gpu: 0.4, motherboard: 0.1, ram: 0.08, storage: 0.07, psu: 0.07, pcCase: 0.04, monitor: 0.04 },
      productivity: { cpu: 0.25, gpu: 0.15, motherboard: 0.12, ram: 0.18, storage: 0.1, psu: 0.08, pcCase: 0.06, monitor: 0.06 },
      'content-creation': { cpu: 0.25, gpu: 0.28, motherboard: 0.1, ram: 0.15, storage: 0.1, psu: 0.06, pcCase: 0.03, monitor: 0.03 },
      programming: { cpu: 0.25, gpu: 0.1, motherboard: 0.12, ram: 0.2, storage: 0.13, psu: 0.08, pcCase: 0.06, monitor: 0.06 },
      general: { cpu: 0.22, gpu: 0.18, motherboard: 0.12, ram: 0.15, storage: 0.12, psu: 0.09, pcCase: 0.06, monitor: 0.06 },
      workstation: { cpu: 0.3, gpu: 0.25, motherboard: 0.1, ram: 0.15, storage: 0.08, psu: 0.06, pcCase: 0.03, monitor: 0.03 }
    }
    const allocation = allocationProfiles[useCase] || allocationProfiles.general
    const build = {}

    // Initial pass: pick near-target options that satisfy constraints
    build.cpu = pickUnderOrClosest(getCandidates('cpu', build, brandPreference), budget * allocation.cpu)
    build.motherboard = pickUnderOrClosest(getCandidates('motherboard', build, brandPreference), budget * allocation.motherboard)
    build.ram = pickUnderOrClosest(getCandidates('ram', build, brandPreference), budget * allocation.ram)
    build.gpu = pickUnderOrClosest(getCandidates('gpu', build, brandPreference), budget * allocation.gpu)
    build.storage = pickUnderOrClosest(getCandidates('storage', build, brandPreference), budget * allocation.storage)
    build.psu = pickUnderOrClosest(getCandidates('psu', build, brandPreference), budget * allocation.psu)
    build.pcCase = pickUnderOrClosest(getCandidates('pcCase', build, brandPreference), budget * allocation.pcCase)
    build.monitor = pickUnderOrClosest(getCandidates('monitor', build, brandPreference), budget * allocation.monitor)

    // Downgrade loop to ensure total <= budget (if feasible)
    const priority = ['pcCase','monitor','storage','psu','ram','gpu','cpu','motherboard']
    const maxSteps = 200
    let steps = 0
    let total = totalPrice({...build})
    while (total > budget && steps < maxSteps){
      let downgraded = false
      for (const cat of priority){
        const list = getCandidates(cat, build, brandPreference)
        const current = build[cat]
        if (!current) continue
        const idx = list.findIndex(x => x.id === current.id)
        if (idx > 0){
          // move to next cheaper option
          build[cat] = list[idx - 1]
          total = totalPrice({...build})
          downgraded = true
          break
        }
      }
      if (!downgraded) break
      steps++
    }

    setCurrentBuild(build)
    setResultsVisible(true)
  }

  const totalPrice = (build)=> Object.values(build||{}).filter(Boolean).reduce((sum,c)=> sum + (c.price||0), 0)
  const componentCount = (build)=> Object.values(build||{}).filter(Boolean).length

  function handleSubmit(e){
    e.preventDefault()
    generateBuildRecommendation({ budget, useCase, performanceLevel, brandPreference })
  }
  function reset(){
    setResultsVisible(false)
    setCurrentBuild(null)
    setBudget(80000)
    setUseCase('')
    setPerformanceLevel('mid-range')
    setBrandPreference('')
    
    window.scrollTo({ top:0, behavior:'smooth' })
  }
  function openInBuilder(){
    if (!currentBuild) return
    const mapped = {
      cpu: currentBuild.cpu || null,
      motherboard: currentBuild.motherboard || null,
      ram: currentBuild.ram || null,
      gpu: currentBuild.gpu || null,
      storage: currentBuild.storage || null,
      psu: currentBuild.psu || null,
      pcCase: currentBuild.pcCase || null,
      monitor: currentBuild.monitor || null
    }
    const encoded = btoa(JSON.stringify(mapped))
    navigate(`/builder?build=${encoded}`)
  }
  function exportBuild(){
    if (!currentBuild) return
    let text = '🖥️ PCease Build Recommendation\n================================\n\n'
    Object.keys(currentBuild).forEach(category => {
      const component = currentBuild[category]
      if (component){
        text += `${getCategoryDisplayName(category)}: ${component.name}\n`
        text += `  Price: ₹${(component.price||0).toLocaleString('en-IN')}\n\n`
      }
    })
    text += `Total: ₹${totalPrice(currentBuild).toLocaleString('en-IN')}\n`
    navigator.clipboard.writeText(text).then(()=>{
      setExporting(true)
      setTimeout(()=> setExporting(false), 2000)
    }).catch(()=> alert('Failed to copy to clipboard'))
  }

  

  if (loading) return <main className="container"><p>Loading components...</p></main>
  if (error) return <main className="container"><p style={{color:'var(--muted)'}}>{error}</p></main>
  return (
    <main className="container">
      <header className="page-header">
        <h1>Build Advisor</h1>
        <p>Answer a few questions and get personalized PC build recommendations tailored to your needs and budget.</p>
      </header>

      <section className="presets-section" aria-labelledby="presets-title">
        <div className="results-header" style={{marginBottom:'1rem'}}>
          <h2 id="presets-title">Quick Presets</h2>
          <p style={{margin:0, color:'var(--muted)', fontSize:'0.95rem'}}>Pick a ready-made build. You can still use the custom advisor below.</p>
        </div>
        <div id="preset-list" className="preset-grid">
          {presets.map(p => {
            const isBudget = isBudgetPreset(p)
            const price = isBudget ? p.budget : totalPriceFromParts(p.parts)
            return (
              <div key={p.id} className="preset-card" onClick={()=> isBudget ? applyBudgetPreset(p) : applyPreset(p)}>
                <div className="preset-title"><span>{p.icon}</span><span>{p.title}</span></div>
                <div style={{color:'var(--muted)', fontSize:'0.95rem'}}>{p.desc}</div>
                <div className="preset-meta">
                  <span>{isBudget ? 'Auto' : `${countFilledParts(p.parts)}/8 parts`}</span>
                  <span className="preset-price">₹{price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="query-form-section">
        <form className="query-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="budget">💰 What's your budget?<span className="label-hint">Total amount you want to spend</span></label>
            <div className="budget-input-group">
              <span className="currency-symbol">₹</span>
              <input type="number" id="budget" min={minBudget} max={maxBudget} step="1000" required placeholder="e.g., 80000" value={budget} onChange={e=> setBudget(Number(e.target.value)||minBudget)} />
            </div>
            <div className="budget-slider-group">
              <input type="range" id="budget-slider" min={minBudget} max={maxBudget} step="5000" value={budget} onChange={e=> setBudget(Number(e.target.value)||minBudget)} style={sliderBg} />
              <div className="budget-markers"><span>₹20K</span><span>₹100K</span><span>₹200K</span><span>₹500K</span></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="use-case">🎯 Primary Use Case<span className="label-hint">What will you mainly use this PC for?</span></label>
            <select id="use-case" required value={useCase} onChange={e=> setUseCase(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="gaming">🎮 Gaming</option>
              <option value="productivity">💼 Productivity / Office Work</option>
              <option value="content-creation">🎨 Content Creation / Video Editing</option>
              <option value="programming">💻 Programming / Development</option>
              <option value="general">🏠 General / Home Use</option>
              <option value="workstation">🖥️ Professional Workstation</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="performance-level">⚡ Performance Level<span className="label-hint">How powerful do you need it to be?</span></label>
            <div className="performance-options">
              <label className="radio-card"><input type="radio" name="performance-level" value="budget" checked={performanceLevel==='budget'} onChange={()=> setPerformanceLevel('budget')} /><div className="radio-card-content"><span className="radio-icon">🥉</span><span className="radio-label">Budget</span><span className="radio-desc">Basic tasks, light gaming</span></div></label>
              <label className="radio-card"><input type="radio" name="performance-level" value="mid-range" checked={performanceLevel==='mid-range'} onChange={()=> setPerformanceLevel('mid-range')} /><div className="radio-card-content"><span className="radio-icon">🥈</span><span className="radio-label">Mid-Range</span><span className="radio-desc">1080p gaming, multitasking</span></div></label>
              <label className="radio-card"><input type="radio" name="performance-level" value="high-end" checked={performanceLevel==='high-end'} onChange={()=> setPerformanceLevel('high-end')} /><div className="radio-card-content"><span className="radio-icon">🥇</span><span className="radio-label">High-End</span><span className="radio-desc">1440p/4K, heavy workloads</span></div></label>
              <label className="radio-card"><input type="radio" name="performance-level" value="enthusiast" checked={performanceLevel==='enthusiast'} onChange={()=> setPerformanceLevel('enthusiast')} /><div className="radio-card-content"><span className="radio-icon">💎</span><span className="radio-label">Enthusiast</span><span className="radio-desc">Top performance, no compromise</span></div></label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="brand-preference">🏷️ Brand Preference (Optional)<span className="label-hint">Do you prefer AMD or Intel?</span></label>
            <select id="brand-preference" value={brandPreference} onChange={e=> setBrandPreference(e.target.value)}>
              <option value="">No Preference</option>
              <option value="AMD">AMD (Ryzen)</option>
              <option value="Intel">Intel (Core)</option>
            </select>
          </div>

          

          <button type="submit" className="submit-btn">✨ Get Build Recommendations</button>
        </form>
      </section>

      <section id="results-section" className={"results-section "+(resultsVisible?"":"hidden")}>
        <div className="results-header">
          <h2>Your Recommended Build</h2>
          <button id="reset-btn" className="reset-btn" type="button" onClick={reset}>🔄 Start Over</button>
        </div>

        {currentBuild && (
          <>
            <div id="build-summary" className="build-summary">
              <h3>Build Summary</h3>
              <p>{performanceLevel === 'preset' ? 'Preset selection:' : 'Based on your requirements for'} <strong>{(useCase || 'Custom').toString().replace('-', ' ')}</strong>.</p>
              <div className="summary-stats">
                <div className="stat-box"><div className="stat-label">Total Price</div><div className="stat-value">₹{totalPrice(currentBuild).toLocaleString('en-IN')}</div></div>
                <div className="stat-box"><div className="stat-label">Your Budget</div><div className="stat-value">₹{(budget||0).toLocaleString('en-IN')}</div></div>
                <div className="stat-box"><div className="stat-label">Budget Status</div><div className="stat-value">{(budget - totalPrice(currentBuild)) >= 0 ? 'Under Budget' : 'Over Budget'}</div></div>
                <div className="stat-box"><div className="stat-label">Components</div><div className="stat-value">{componentCount(currentBuild)}/8</div></div>
              </div>
            </div>

            <div id="recommended-components" className="recommended-components">
              {['cpu','gpu','motherboard','ram','storage','psu','pcCase','monitor'].map(category => {
                const component = currentBuild[category]; if (!component) return null
                const buy = getCheapestVendor(component)
                return (
                  <div key={category} className="component-card">
                    <div className="component-icon">{({cpu:'⚡', gpu:'🎮', motherboard:'🔌', ram:'🧠', storage:'💾', psu:'🔋', pcCase:'📦', monitor:'🖥️'})[category]}</div>
                    <div className="component-info">
                      <div className="component-category">{getCategoryDisplayName(category)}</div>
                      <div className="component-name">{component.name}</div>
                      <div className="component-specs">{getComponentSpecs(component)}</div>
                    </div>
                    <div className="component-price">{buy ? <a className="buy-now-btn" href={buy.url} target="_blank" rel="noopener noreferrer">🛒</a> : null}₹{(component.price||0).toLocaleString('en-IN')}</div>
                  </div>
                )
              })}
            </div>

            <div className="results-actions">
              <button id="open-in-builder-btn" className="action-btn primary" onClick={openInBuilder}>🔧 Open in PC Builder</button>
              <button id="export-recommendation-btn" className="action-btn" onClick={exportBuild}>{exporting ? '✅ Copied!' : '📤 Export Build'}</button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
