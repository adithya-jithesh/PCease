import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/home.css'
import { getComponentsStructured, getThreads } from '../shared/api.js'

function DBStats() {
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
      <span>{stats.categories} Component Categories</span>
      <span>{stats.total}+ Products Available</span>
      <span>Real-time Price Comparison</span>
    </div>
  )
}

function ForumInline() {
  const [threads, setThreads] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { try { const list = await getThreads(''); setThreads(list) } catch { } finally { setLoading(false) } })() }, [])
  const filtered = useMemo(() => (filter ? threads.filter(t => t.category === filter) : threads).slice(0, 4), [threads, filter])

  return (
    <section id="community" className="forum" aria-labelledby="community-title">
      <div className="container">
        <h2 id="community-title" className="section-title">Community Forum</h2>
        <p className="forum-subtitle">Join the conversation. Share builds, get advice, and connect with PC enthusiasts.</p>
        <div className="forum-layout">
          <div className="forum-column">
            <div className="forum-filter">
              <label htmlFor="home-filter-category">Filter:</label>
              <select id="home-filter-category" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All Topics</option>
                <option value="General">General</option>
                <option value="Builds">Builds</option>
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="News">News</option>
              </select>
            </div>
            <Link to="/forum" className="cta-button" style={{ width: '100%', textAlign: 'center' }}>Open Forum →</Link>
          </div>
          <div className="forum-column">
            <div id="threads-list" className="threads-list" aria-live="polite">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <article key={'skeleton-inline-' + i} className="thread-card">
                    <div className="thread-header">
                      <h3 className="thread-title skeleton" style={{ width: '60%', height: '20px' }}>&nbsp;</h3>
                      <div className="thread-meta">
                        <span className="thread-badge skeleton" style={{ width: 60, height: '18px' }}>&nbsp;</span>
                      </div>
                    </div>
                    <p className="thread-content skeleton" style={{ height: 40 }}>&nbsp;</p>
                  </article>
                ))
              ) : filtered.length === 0 ? (
                <p className="forum-empty">No threads yet. Be the first to start a discussion!</p>
              ) : filtered.map(t => (
                <article key={t._id} className="thread-card">
                  <div className="thread-header">
                    <h3 className="thread-title">{t.title}</h3>
                    <div className="thread-meta">
                      <span className="thread-badge">{t.category}</span>
                      <span className="thread-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                      <span className="thread-author">by {t.user || 'Guest'}</span>
                    </div>
                  </div>
                  <p className="thread-content">{t.content?.slice(0, 120)}{t.content?.length > 120 ? '...' : ''}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const categoryData = [
  { key: 'cpu', emoji: '⚡', title: 'Processors', desc: 'AMD Ryzen & Intel Core' },
  { key: 'gpu', emoji: '🎮', title: 'Graphics Cards', desc: 'GeForce & Radeon' },
  { key: 'motherboard', emoji: '🔌', title: 'Motherboards', desc: 'AM5, LGA1700 & More' },
  { key: 'ram', emoji: '🧠', title: 'Memory', desc: 'DDR4 & DDR5 Kits' },
  { key: 'storage', emoji: '💾', title: 'Storage', desc: 'NVMe SSDs & HDDs' },
  { key: 'pcCase', emoji: '📦', title: 'Cases', desc: 'ATX, mATX & ITX' },
  { key: 'psu', emoji: '🔋', title: 'Power Supplies', desc: 'Gold & Platinum Rated' },
  { key: 'monitor', emoji: '🖥️', title: 'Monitors', desc: '144Hz to 4K Displays' },
]

const features = [
  {
    icon: '🎯',
    title: 'Smart Compatibility',
    desc: 'We automatically check RAM types, form factors, and CPU-motherboard compatibility while you build.'
  },
  {
    icon: '💰',
    title: 'Price Comparison',
    desc: 'Compare prices from multiple Indian vendors like Amazon, PrimeABGB, and MDComputers in real-time.'
  },
  {
    icon: '🤖',
    title: 'Build Advisor',
    desc: 'Tell us your budget and use case, and we\'ll generate a recommended build tailored to your needs.'
  },
]

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <header className="hero">
        <div className="hero-decoration"></div>
        <div className="hero-decoration"></div>
        <div className="hero-content container">
          <h1>Build Your Dream PC<br />with <span>Confidence</span></h1>
          <p>
            Smart, stress-free PC building for everyone. Compare prices, check compatibility,
            and create the perfect system—all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/builder" className="cta-button">🔧 Start Building</Link>
            <Link to="/browse" className="secondary-button">Browse Components</Link>
          </div>
          <DBStats />
        </div>
      </header>

      {/* About Section */}
      <section className="about" aria-labelledby="about-title">
        <div className="container">
          <h2 id="about-title" className="section-title">Why PCease?</h2>
          <p>
            PCease makes PC building accessible to everyone. Whether you're a first-time builder
            or a seasoned enthusiast, our tools help you find the right parts, ensure compatibility,
            and get the best prices from trusted Indian retailers. No more spreadsheet comparisons
            or compatibility headaches.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" aria-labelledby="features-title">
        <div className="container">
          <h2 id="features-title" className="section-title">Powerful Features</h2>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forum Preview */}
      <ForumInline />

      {/* Categories Section */}
      <section className="categories" aria-labelledby="categories-title">
        <div className="container">
          <h2 id="categories-title" className="section-title">Explore Components</h2>
          <div className="card-grid">
            {categoryData.map(cat => (
              <Link
                key={cat.key}
                className="card"
                to={`/browse?category=${cat.key}#search`}
                aria-label={`Browse ${cat.title}`}
              >
                <div className="card-emoji">{cat.emoji}</div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
