import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getComponentsStructured,
  getLowestPrice,
  getBestVendor,
  formatPrice,
  getRecommendedBuild
} from '../shared/api.js'
import '../styles/query.css'

const categoryConfig = {
  cpu: { icon: '⚡', name: 'Processor' },
  gpu: { icon: '🎮', name: 'Graphics Card' },
  motherboard: { icon: '🔌', name: 'Motherboard' },
  ram: { icon: '🧠', name: 'Memory' },
  storage: { icon: '💾', name: 'Storage' },
  psu: { icon: '🔋', name: 'Power Supply' },
  pcCase: { icon: '📦', name: 'Case' },
  monitor: { icon: '🖥️', name: 'Monitor' }
}

function getSpecs(component) {
  const specs = []
  if (component.cores) specs.push(`${component.cores} cores`)
  if (component.memory) specs.push(component.memory)
  if (component.capacity) specs.push(component.capacity)
  if (component.wattage) specs.push(`${component.wattage}W`)
  if (component.formFactor) specs.push(component.formFactor)
  return specs.slice(0, 3).join(' • ') || component.brand || ''
}

const presets = [
  { id: 'budget-50k', icon: '💸', name: '₹50K Starter', desc: 'Entry-level gaming', budget: 50000, useCase: 'general', perf: 'Great for esports titles' },
  { id: 'budget-75k', icon: '🎮', name: '₹75K Gaming', desc: '1080p gaming ready', budget: 75000, useCase: 'gaming', perf: '60 FPS at High' },
  { id: 'budget-1l', icon: '⚡', name: '₹1L Gaming', desc: '1080p/1440p capable', budget: 100000, useCase: 'gaming', perf: '1080p Ultra' },
  { id: 'budget-1_5l', icon: '🥈', name: '₹1.5L Mid-High', desc: 'Strong 1440p gaming', budget: 150000, useCase: 'gaming', perf: '1440p High' },
  { id: 'budget-2l', icon: '🎬', name: '₹2L Creator', desc: 'Content creation', budget: 200000, useCase: 'productivity', perf: '4K Editing' },
  { id: 'budget-3l', icon: '💎', name: '₹3L High-End', desc: 'High-end 1440p/4K', budget: 300000, useCase: 'gaming', perf: '4K Ready' },
  { id: 'budget-4l', icon: '🚀', name: '₹4L Enthusiast', desc: 'Enthusiast-grade', budget: 400000, useCase: 'gaming', perf: 'Max Settings' },
  { id: 'budget-5l', icon: '🏆', name: '₹5L Ultimate', desc: 'No-compromise', budget: 500000, useCase: 'gaming', perf: 'Dream Build' }
]

export default function Query() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [db, setDb] = useState({})

  // Form state
  const [budget, setBudget] = useState(100000)
  const [useCase, setUseCase] = useState('gaming')
  const [performance, setPerformance] = useState('balanced')

  // Results
  const [currentBuild, setCurrentBuild] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [exported, setExported] = useState(false)

  const minBudget = 30000
  const maxBudget = 500000

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

  const generateBuild = async (targetBudget, targetUseCase) => {
    try {
      const recommendations = await getRecommendedBuild(targetBudget, targetUseCase, performance)
      setCurrentBuild(recommendations)
      setShowResults(true)
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (e) {
      console.error('Failed to generate build:', e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    generateBuild(budget, useCase)
  }

  const applyPreset = (preset) => {
    setBudget(preset.budget)
    setUseCase(preset.useCase)
    generateBuild(preset.budget, preset.useCase)
  }

  const reset = () => {
    setShowResults(false)
    setCurrentBuild(null)
    setBudget(100000)
    setUseCase('gaming')
    setPerformance('balanced')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openInBuilder = () => {
    if (!currentBuild) return
    const encoded = btoa(JSON.stringify(currentBuild))
    navigate(`/builder?build=${encoded}`)
  }

  const exportBuild = () => {
    if (!currentBuild) return
    const parts = Object.entries(currentBuild)
      .filter(([_, c]) => c)
      .map(([cat, c]) => `${categoryConfig[cat]?.name}: ${c.name} - ${formatPrice(getLowestPrice(c))}`)

    const text = `🖥️ PCease Build Recommendation\n\n${parts.join('\n')}\n\nTotal: ${formatPrice(totalPrice)}`
    navigator.clipboard.writeText(text).then(() => {
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    })
  }

  const totalPrice = useMemo(() => {
    if (!currentBuild) return 0
    return Object.values(currentBuild)
      .filter(Boolean)
      .reduce((sum, c) => sum + (getLowestPrice(c) || 0), 0)
  }, [currentBuild])

  const componentCount = useMemo(() => {
    if (!currentBuild) return 0
    return Object.values(currentBuild).filter(Boolean).length
  }, [currentBuild])

  if (loading) {
    return (
      <main className="container">
        <div className="advisor-header">
          <h1>Build Advisor</h1>
          <p>Loading components...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container">
        <div className="advisor-header">
          <h1>Build Advisor</h1>
          <p className="muted">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="advisor-header">
        <h1>Build Advisor</h1>
        <p>Get personalized PC build recommendations based on your budget and needs</p>
      </div>

      {/* Quick Presets */}
      <section className="presets-section">
        <div className="presets-header">
          <h2>Quick Presets</h2>
        </div>
        <div className="preset-grid">
          {presets.map(preset => (
            <div key={preset.id} className="preset-card" onClick={() => applyPreset(preset)}>
              <span className="preset-icon">{preset.icon}</span>
              <div className="preset-name">{preset.name}</div>
              <p className="preset-desc">{preset.desc}</p>
              <div className="preset-footer">
                <span className="preset-perf">{preset.perf}</span>
                <span className="preset-price">{formatPrice(preset.budget)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Form */}
      <section className="form-section">
        <h2>Custom Build</h2>
        <form className="advisor-form" onSubmit={handleSubmit}>
          {/* Budget */}
          <div className="form-group">
            <label className="form-label">
              💰 What's your budget?
              <span className="form-hint">Total amount you want to spend</span>
            </label>
            <div className="budget-group">
              <span className="currency">₹</span>
              <input
                type="number"
                className="budget-input"
                min={minBudget}
                max={maxBudget}
                step="5000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value) || minBudget)}
              />
            </div>
            <div className="slider-group">
              <input
                type="range"
                className="budget-slider"
                min={minBudget}
                max={maxBudget}
                step="5000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
              />
              <div className="slider-markers">
                <span>₹30K</span>
                <span>₹150K</span>
                <span>₹300K</span>
                <span>₹500K</span>
              </div>
            </div>
          </div>

          {/* Use Case */}
          <div className="form-group">
            <label className="form-label">
              🎯 Primary Use Case
              <span className="form-hint">What will you mainly use this PC for?</span>
            </label>
            <select className="form-select" value={useCase} onChange={e => setUseCase(e.target.value)}>
              <option value="gaming">🎮 Gaming</option>
              <option value="productivity">💼 Productivity / Office</option>
              <option value="general">🏠 General Use</option>
            </select>
          </div>

          {/* Performance Level */}
          <div className="form-group">
            <label className="form-label">
              ⚡ Performance Level
              <span className="form-hint">How powerful do you need it?</span>
            </label>
            <div className="perf-grid">
              <label className="perf-card">
                <input
                  type="radio"
                  name="performance"
                  value="budget"
                  checked={performance === 'budget'}
                  onChange={() => setPerformance('budget')}
                />
                <div className="perf-content">
                  <span className="perf-icon">🥉</span>
                  <span className="perf-name">Budget</span>
                  <span className="perf-desc">Basic tasks</span>
                </div>
              </label>
              <label className="perf-card">
                <input
                  type="radio"
                  name="performance"
                  value="balanced"
                  checked={performance === 'balanced'}
                  onChange={() => setPerformance('balanced')}
                />
                <div className="perf-content">
                  <span className="perf-icon">🥈</span>
                  <span className="perf-name">Balanced</span>
                  <span className="perf-desc">Best value</span>
                </div>
              </label>
              <label className="perf-card">
                <input
                  type="radio"
                  name="performance"
                  value="performance"
                  checked={performance === 'performance'}
                  onChange={() => setPerformance('performance')}
                />
                <div className="perf-content">
                  <span className="perf-icon">🥇</span>
                  <span className="perf-name">High-End</span>
                  <span className="perf-desc">Max power</span>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            ✨ Get Build Recommendations
          </button>
        </form>
      </section>

      {/* Results */}
      <section id="results-section" className={`results-section ${showResults ? '' : 'hidden'}`}>
        <div className="results-header">
          <h2>Your Recommended Build</h2>
          <button className="reset-btn" onClick={reset}>🔄 Start Over</button>
        </div>

        {currentBuild && (
          <>
            {/* Summary Card */}
            <div className="build-summary-card">
              <h3>Build Summary</h3>
              <p>Optimized for <strong>{useCase}</strong> with {formatPrice(budget)} budget</p>
              <div className="summary-stats">
                <div className="stat-box">
                  <span className="stat-box-label">Total Price</span>
                  <span className="stat-box-value">{formatPrice(totalPrice)}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-label">Your Budget</span>
                  <span className="stat-box-value">{formatPrice(budget)}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-label">Status</span>
                  <span className="stat-box-value">
                    {totalPrice <= budget ? '✅ Under' : '⚠️ Over'}
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-label">Components</span>
                  <span className="stat-box-value">{componentCount}/8</span>
                </div>
              </div>
            </div>

            {/* Recommended Components */}
            <div className="recommended-grid">
              {Object.entries(categoryConfig).map(([category, config]) => {
                const component = currentBuild[category]
                if (!component) return null

                const bestVendor = getBestVendor(component)
                const price = getLowestPrice(component)

                return (
                  <div key={category} className="recommended-card">
                    <div className="component-icon">{config.icon}</div>
                    <div className="component-details">
                      <span className="component-category">{config.name}</span>
                      <div className="component-name">{component.name}</div>
                      <span className="component-specs">{getSpecs(component)}</span>
                    </div>
                    <div className="component-price">
                      {bestVendor && (
                        <a className="buy-link" href={bestVendor.url} target="_blank" rel="noreferrer">🛒</a>
                      )}
                      {formatPrice(price)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="results-actions">
              <button className="action-btn primary" onClick={openInBuilder}>
                🔧 Open in PC Builder
              </button>
              <button className="action-btn secondary" onClick={exportBuild}>
                {exported ? '✅ Copied!' : '📤 Export Build'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
