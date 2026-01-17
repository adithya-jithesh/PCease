import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/home.css'
import { getComponentsStructured, getThreads } from '../shared/api.js'

function HeroStats() {
  const [stats, setStats] = useState({ categories: 0, total: 0 })

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const grouped = await getComponentsStructured()
          const categories = Object.keys(grouped)
          const total = categories.reduce((sum, k) => sum + (grouped[k]?.length || 0), 0)
          if (mounted) setStats({ categories: categories.length, total })
        } catch { }
      })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="hero-stats">
      <div className="stat-item">
        <span className="stat-value">{stats.categories}</span>
        <span className="stat-label">Categories</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.total}+</span>
        <span className="stat-label">Components</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">5+</span>
        <span className="stat-label">Vendors</span>
      </div>
    </div>
  )
}

function ThreadsPreview() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const list = await getThreads('')
        setThreads(list.slice(0, 4))
      } catch { }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) {
    return (
      <div className="threads-preview">
        {[1, 2].map(i => (
          <div key={i} className="thread-card">
            <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 12 }}></div>
            <div className="skeleton" style={{ height: 24, width: '80%', marginBottom: 8 }}></div>
            <div className="skeleton" style={{ height: 40, width: '100%' }}></div>
          </div>
        ))}
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="threads-preview">
        <div className="thread-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
          <p className="muted">No discussions yet. Be the first to start one!</p>
          <Link to="/forum" className="cta-button" style={{ marginTop: 16 }}>Start Discussion</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="threads-preview">
      {threads.map(t => (
        <article key={t._id} className="thread-card">
          <div className="thread-meta">
            <span className="thread-badge">{t.category}</span>
            <span className="thread-date">{new Date(t.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="thread-title">{t.title}</h3>
          <p className="thread-excerpt">{t.content}</p>
        </article>
      ))}
    </div>
  )
}

const categories = [
  { key: 'cpu', icon: '⚡', name: 'Processors', desc: 'AMD & Intel CPUs' },
  { key: 'gpu', icon: '🎮', name: 'Graphics Cards', desc: 'RTX & Radeon' },
  { key: 'motherboard', icon: '🔌', name: 'Motherboards', desc: 'AM5 & LGA1700' },
  { key: 'ram', icon: '🧠', name: 'Memory', desc: 'DDR4 & DDR5' },
  { key: 'storage', icon: '💾', name: 'Storage', desc: 'NVMe & SSD' },
  { key: 'psu', icon: '🔋', name: 'Power Supply', desc: 'Gold+ Rated' },
  { key: 'pcCase', icon: '📦', name: 'Cases', desc: 'ATX & ITX' },
  { key: 'monitor', icon: '🖥️', name: 'Monitors', desc: '144Hz to 4K' },
]

const features = [
  {
    icon: '🎯',
    title: 'Smart Compatibility',
    desc: 'Real-time checks for CPU sockets, RAM types, and form factors to prevent mismatches.'
  },
  {
    icon: '💰',
    title: 'Price Comparison',
    desc: 'Compare prices across Amazon, PrimeABGB, MDComputers, and more Indian retailers.'
  },
  {
    icon: '🤖',
    title: 'AI Build Advisor',
    desc: 'Tell us your budget and get optimized component recommendations instantly.'
  }
]

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>

        <div className="hero-content">
          <h1>
            Build Your Dream PC<br />
            <span className="gradient-text">with Confidence</span>
          </h1>
          <p className="hero-subtitle">
            The smartest way to build a PC in India. Compare prices, check compatibility,
            and create the perfect system — all in one beautiful place.
          </p>
          <div className="hero-actions">
            <Link to="/builder" className="cta-button">
              🔧 Start Building
            </Link>
            <Link to="/browse" className="secondary-button">
              Browse Components →
            </Link>
          </div>
          <HeroStats />
        </div>
      </section>

      {/* Features Section */}
      <section className="features container">
        <h2 className="section-title">Why PCease?</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-card-content">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories container">
        <h2 className="section-title">Explore Components</h2>
        <div className="category-grid">
          {categories.map(cat => (
            <Link
              key={cat.key}
              to={`/browse?category=${cat.key}`}
              className="category-card"
            >
              <span className="category-icon">{cat.icon}</span>
              <h3>{cat.name}</h3>
              <p>{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Forum Preview */}
      <section className="forum-section container">
        <div className="forum-header">
          <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>Community</h2>
          <Link to="/forum" className="secondary-button">View All →</Link>
        </div>
        <ThreadsPreview />
      </section>
    </main>
  )
}
