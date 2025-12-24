import React, { useEffect, useMemo, useState } from 'react'
import '../styles/home.css'
import { getComponentsStructured, getThreads } from '../shared/api.js'

function DBStats() {
  const [stats, setStats] = useState({ categories: 0, total: 0 })
  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try{
        const grouped = await getComponentsStructured()
        const categories = Object.keys(grouped)
        const total = categories.reduce((sum,k)=> sum + (grouped[k]?.length||0), 0)
        if(mounted) setStats({ categories: categories.length, total })
      }catch{}
    })()
    return ()=>{ mounted = false }
  },[])
  return <div className="hero-stats"><span>{stats.categories} categories • {stats.total} components</span></div>
}

function ForumInline() {
  const [threads, setThreads] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ (async()=>{ try{ const list = await getThreads(''); setThreads(list) } finally{ setLoading(false) } })() },[])
  const filtered = useMemo(()=> (filter ? threads.filter(t=>t.category===filter) : threads).slice(0,6), [threads, filter])
  return (
    <section id="community" className="forum" aria-labelledby="community-title">
      <div className="container">
        <h2 id="community-title" className="section-title">Community Forum</h2>
        <p className="forum-subtitle">Discuss PC builds, share the latest trends, and help each other out.</p>
        <div className="forum-layout">
          <div className="forum-column" style={{flexBasis:'35%'}}>
            <div className="forum-filter" style={{marginBottom:12}}>
              <label htmlFor="home-filter-category">Filter:</label>
              <select id="home-filter-category" value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="">All</option>
                <option value="General">General</option>
                <option value="Builds">Builds</option>
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="News">News</option>
              </select>
            </div>
            <a href="/forum" className="cta-button">Open Forum</a>
          </div>
          <div className="forum-column">
            <div id="threads-list" className="threads-list" aria-live="polite">
              {loading ? (
                [...Array(3)].map((_,i)=> (
                  <article key={'skeleton-inline-'+i} className="thread-card">
                    <div className="thread-header">
                      <h3 className="thread-title skeleton" style={{width:'60%'}}>&nbsp;</h3>
                      <div className="thread-meta">
                        <span className="thread-badge skeleton" style={{width:60}}>&nbsp;</span>
                        <span className="thread-date skeleton" style={{width:100}}>&nbsp;</span>
                      </div>
                    </div>
                    <p className="thread-content skeleton" style={{height:50}}>&nbsp;</p>
                  </article>
                ))
              ) : filtered.length===0 ? <p className="forum-empty">No threads yet. Be the first to post!</p> : filtered.map(t => (
                <article key={t._id} className="thread-card">
                  <div className="thread-header">
                    <h3 className="thread-title">{t.title}</h3>
                    <div className="thread-meta">
                      <span className="thread-badge">{t.category}</span>
                      <span className="thread-date">{new Date(t.createdAt).toLocaleString()}</span>
                      <span className="thread-author">by {t.user || 'Guest'}</span>
                    </div>
                  </div>
                  <p className="thread-content">{t.content}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div className="hero-content container">
          <h1>Build Your Dream PC with Confidence</h1>
          <p>Smart, stress-free PC building for everyone.</p>
          <div className="hero-actions">
            <a href="/builder" className="cta-button">Start Building</a>
            <a href="/browse" className="secondary-button">Browse Components</a>
          </div>
          <DBStats />
        </div>
      </header>

      <section className="about" aria-labelledby="about-title">
        <div className="container">
          <h2 id="about-title" className="section-title">About PCease</h2>
          <p>
            PCease helps you plan and build your next PC with confidence. Use the PC Builder to pick parts,
            and the Browse page to explore components and prices. Whether you're new to PC building or an enthusiast,
            we're here to make it simple and fun.
          </p>
        </div>
      </section>

      <section className="features" aria-labelledby="features-title">
        <div className="container">
          <h2 id="features-title" className="section-title">Why Choose PCease</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Clarity First</h3>
              <p>Clean layout and simple flows keep you focused on what matters—your build.</p>
            </div>
            <div className="feature-card">
              <h3>Smart Checks</h3>
              <p>We highlight brand, RAM, and form-factor compatibility while you pick parts.</p>
            </div>
            <div className="feature-card">
              <h3>Price Awareness</h3>
              <p>Compare vendor prices side-by-side in the Browse page before you buy.</p>
            </div>
          </div>
        </div>
      </section>

      <ForumInline />

      <section className="categories" aria-labelledby="categories-title">
        <div className="container">
          <h2 id="categories-title" className="section-title">Explore Components</h2>
          <div className="card-grid">
            <a className="card" href="/browse?category=cpu#search" aria-label="Browse CPUs">
              <div className="card-emoji">🧠</div>
              <h3>CPUs</h3>
              <p>Ryzen, Core, and more</p>
            </a>
            <a className="card" href="/browse?category=gpu#search" aria-label="Browse GPUs">
              <div className="card-emoji">🎮</div>
              <h3>GPUs</h3>
              <p>GeForce, Radeon</p>
            </a>
            <a className="card" href="/browse?category=motherboard#search" aria-label="Browse Motherboards">
              <div className="card-emoji">🧩</div>
              <h3>Motherboards</h3>
              <p>AM5, LGA1700</p>
            </a>
            <a className="card" href="/browse?category=ram#search" aria-label="Browse Memory">
              <div className="card-emoji">⚡</div>
              <h3>Memory</h3>
              <p>DDR4/DDR5 kits</p>
            </a>
            <a className="card" href="/browse?category=storage#search" aria-label="Browse Storage">
              <div className="card-emoji">💾</div>
              <h3>Storage</h3>
              <p>NVMe, SATA SSDs</p>
            </a>
            <a className="card" href="/browse?category=pcCase#search" aria-label="Browse Cases">
              <div className="card-emoji">🧱</div>
              <h3>Cases</h3>
              <p>ATX, mATX, ITX</p>
            </a>
            <a className="card" href="/browse?category=psu#search" aria-label="Browse PSUs">
              <div className="card-emoji">🔋</div>
              <h3>PSUs</h3>
              <p>Certified power supplies</p>
            </a>
            <a className="card" href="/browse?category=monitor#search" aria-label="Browse Monitors">
              <div className="card-emoji">🖥️</div>
              <h3>Monitors</h3>
              <p>Displays for all needs</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
