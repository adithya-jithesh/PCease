import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API, CATEGORIES } from '../services/api'
import './Home.css'

const features = [
    {
        icon: '💰',
        title: 'Live Price Comparison',
        desc: 'Compare prices across Amazon, Flipkart, MDComputers, PrimeABGB, PCStudio, Vedant and more — in real time.',
    },
    {
        icon: '🔗',
        title: 'Shareable Build Links',
        desc: 'Create a PC build and share it with anyone via a unique link. No login required to view or share.',
    },
    {
        icon: '🤖',
        title: 'AI Build Advisor',
        desc: 'Get personalized component recommendations based on your budget and use case, powered by AI.',
    },
    {
        icon: '⚡',
        title: 'Compatibility Checker',
        desc: 'Real-time checks for CPU sockets, RAM types, form factors, and power requirements.',
    },
    {
        icon: '📊',
        title: 'Bottleneck Analyzer',
        desc: 'Detect CPU-GPU bottlenecks before you buy. Ensure balanced performance for your build.',
    },
    {
        icon: '💬',
        title: 'Community Forum',
        desc: 'Ask questions, share builds, get help from the Indian PC building community.',
    },
]

const retailers = [
    'Amazon.in', 'Flipkart', 'MDComputers', 'PrimeABGB', 'PCStudio', 'Vedant Computers', 'The IT Depot',
]

export default function Home() {
    const [stats, setStats] = useState({ categories: 0, components: 0, vendors: 0, users: 0 })

    useEffect(() => {
        API.getStats().then(setStats).catch(() => {})
    }, [])

    return (
        <main className="home">
            {/* ===== Hero ===== */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-grid"></div>
                    <div className="hero-glow hero-glow-1"></div>
                    <div className="hero-glow hero-glow-2"></div>
                    <div className="hero-glow hero-glow-3"></div>
                </div>

                <div className="container hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        India's #1 PC Building Platform
                    </div>

                    <h1>
                        Build Smarter.
                        <br />
                        <span className="text-gradient">Build with PCease.</span>
                    </h1>

                    <p className="hero-desc">
                        Compare prices across {retailers.length}+ Indian retailers, check compatibility in
                        real-time, get AI-powered recommendations, and share builds with friends
                        — all in one place.
                    </p>

                    <div className="hero-cta">
                        <Link to="/builder" className="btn btn-primary btn-lg">
                            Start Building →
                        </Link>
                        <Link to="/browse" className="btn btn-lg">
                            Explore Parts
                        </Link>
                        <Link to="/advisor" className="btn btn-lg btn-ai">
                            🤖 Ask AI
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">{stats.components || '500'}+</span>
                            <span className="stat-label">Components</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{stats.vendors || '7'}+</span>
                            <span className="stat-label">Retailers</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{stats.categories || '8'}</span>
                            <span className="stat-label">Categories</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">₹0</span>
                            <span className="stat-label">Always Free</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Retailers ===== */}
            <section className="retailers-strip">
                <div className="container">
                    <p className="retailers-label">Prices from</p>
                    <div className="retailers-scroll">
                        {retailers.map((r) => (
                            <span key={r} className="retailer-name">{r}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Features ===== */}
            <section className="features container">
                <div className="section-center">
                    <h2 className="section-title">Why Choose PCease?</h2>
                    <p className="section-subtitle">
                        Everything you need to plan, compare, and build your dream PC.
                    </p>
                </div>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card card">
                            <span className="feature-icon">{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== Categories ===== */}
            <section className="categories container">
                <div className="section-center">
                    <h2 className="section-title">Explore Components</h2>
                    <p className="section-subtitle">Browse parts across all major categories</p>
                </div>
                <div className="category-grid">
                    {Object.entries(CATEGORIES).map(([slug, cat]) => (
                        <Link key={slug} to={`/browse?category=${slug}`} className="category-card card">
                            <span className="cat-icon">{cat.icon}</span>
                            <span className="cat-abbr">{cat.abbr}</span>
                            <h3>{cat.name}</h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ===== How it Works ===== */}
            <section className="how-it-works container">
                <div className="section-center">
                    <h2 className="section-title">How It Works</h2>
                </div>
                <div className="steps-grid">
                    <div className="step-card">
                        <span className="step-num">01</span>
                        <h3>Choose Components</h3>
                        <p>Browse and select parts from our database of 500+ components with live Indian prices.</p>
                    </div>
                    <div className="step-card">
                        <span className="step-num">02</span>
                        <h3>Check Compatibility</h3>
                        <p>Our system checks socket compatibility, power requirements, and form factor in real-time.</p>
                    </div>
                    <div className="step-card">
                        <span className="step-num">03</span>
                        <h3>Compare & Save</h3>
                        <p>Compare prices across retailers, save your build, or share it with friends via a unique link.</p>
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="cta-section">
                <div className="container cta-inner">
                    <h2>Ready to Build Your Dream PC?</h2>
                    <p>Join thousands of PC builders across India. Start your build today — it's free.</p>
                    <div className="cta-buttons">
                        <Link to="/builder" className="btn btn-primary btn-lg">
                            Launch Builder →
                        </Link>
                        <Link to="/register" className="btn btn-lg">
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
