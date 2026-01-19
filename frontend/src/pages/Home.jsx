import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getCategories, getThreads } from '../services/api'
import './Home.css'

const features = [
    { title: 'Smart Compatibility', desc: 'Real-time checks for CPU sockets, RAM types, and form factors.' },
    { title: 'Price Comparison', desc: 'Compare prices across Amazon, PrimeABGB, MDComputers, and more.' },
    { title: 'AI Build Advisor', desc: 'Get optimized component recommendations based on your budget.' }
]

export default function Home() {
    const [stats, setStats] = useState({ categories: 0, components: 0, vendors: 0 })
    const [threads, setThreads] = useState([])

    useEffect(() => {
        getStats().then(setStats).catch(() => { })
        getThreads().then(t => setThreads(t.slice(0, 4))).catch(() => { })
    }, [])

    return (
        <main>
            {/* Hero */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-grid"></div>
                    <div className="hero-glow hero-glow-1"></div>
                    <div className="hero-glow hero-glow-2"></div>
                </div>

                <div className="container hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        India's #1 PC Building Platform
                    </div>

                    <h1>
                        Build Smarter.<br />
                        <span className="text-gradient">Build with PCease.</span>
                    </h1>

                    <p className="hero-desc">
                        Compare prices across 5+ retailers, check compatibility in real-time,
                        and get AI-powered recommendations — all in one place.
                    </p>

                    <div className="hero-cta">
                        <Link to="/builder" className="btn btn-primary btn-lg">Start Building</Link>
                        <Link to="/browse" className="btn btn-lg">Explore →</Link>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">{stats.categories}</span>
                            <span className="stat-label">Categories</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{stats.components}+</span>
                            <span className="stat-label">Components</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{stats.vendors}+</span>
                            <span className="stat-label">Vendors</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features container">
                <h2 className="section-title">Why PCease?</h2>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card card">
                            <span className="feature-num">{String(i + 1).padStart(2, '0')}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="categories container">
                <h2 className="section-title">Explore Components</h2>
                <div className="category-grid">
                    {['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'pcCase', 'monitor'].map(cat => (
                        <Link key={cat} to={`/browse?category=${cat}`} className="category-card card">
                            <span className="cat-abbr">{cat.toUpperCase().slice(0, 3)}</span>
                            <h3>{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Forum Preview */}
            <section className="forum-preview container">
                <div className="section-header">
                    <h2 className="section-title">Community</h2>
                    <Link to="/forum" className="btn">View All →</Link>
                </div>
                <div className="threads-grid">
                    {threads.length === 0 ? (
                        <p className="muted">No discussions yet. Be the first!</p>
                    ) : threads.map(t => (
                        <article key={t.id} className="thread-card card">
                            <span className="thread-cat">{t.category}</span>
                            <h3>{t.title}</h3>
                            <p>{t.content?.slice(0, 100)}...</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    )
}
