import { Link } from 'react-router-dom'
import { FiArrowRight, FiCpu, FiDollarSign, FiZap, FiMessageCircle, FiLayers, FiTrendingUp } from 'react-icons/fi'
import { CATEGORIES } from '../services/api'
import './Home.css'

const stats = [
    { value: '9+', label: 'Indian Retailers' },
    { value: '200+', label: 'Components' },
    { value: '10', label: 'Categories' },
    { value: '₹0', label: 'Always Free' },
]

const features = [
    { icon: <FiDollarSign />, title: 'Price Compare', desc: 'Side-by-side prices from Amazon, Flipkart, MDComputers, and 6 more retailers.', span: false },
    { icon: <FiCpu />, title: 'AI Advisor', desc: 'Tell us your budget and use case — Gemini picks the best parts for you.', span: false },
    { icon: <FiLayers />, title: 'PC Builder', desc: 'Drag-and-drop interface with auto compatibility checks, wattage estimates, and shareable links.', span: true },
    { icon: <FiTrendingUp />, title: 'Bottleneck Analysis', desc: 'Detect CPU-GPU imbalances before you buy.', span: false },
    { icon: <FiZap />, title: 'Wattage Calculator', desc: 'Accurate TDP estimates and PSU size recommendations.', span: false },
    { icon: <FiMessageCircle />, title: 'Community', desc: 'Ask questions, share builds, and get advice from Indian PC enthusiasts.', span: false },
]

const steps = [
    { n: '1', title: 'Browse parts', desc: 'Filter by category. Compare prices across retailers.' },
    { n: '2', title: 'Build your PC', desc: 'Pick each component. We validate compatibility.' },
    { n: '3', title: 'Share & buy', desc: 'Copy a link or visit the cheapest store directly.' },
]

export default function Home() {
    return (
        <main className="page home">
            {/* ── Hero ── */}
            <section className="hero">
                <div className="hero__glow" />
                <div className="container hero__inner">
                    <span className="hero__badge">
                        <span className="hero__badge-dot" />
                        India&#39;s PC building platform
                    </span>
                    <h1>
                        Build smarter.<br />
                        <span className="text-accent">Pay less.</span>
                    </h1>
                    <p className="hero__sub">
                        Compare prices across 9 Indian retailers, get AI-powered recommendations,
                        and share your build — completely free.
                    </p>
                    <div className="hero__cta">
                        <Link to="/builder" className="btn btn-primary btn-lg">
                            Start Building <FiArrowRight size={15} />
                        </Link>
                        <Link to="/browse" className="btn btn-lg">Browse Components</Link>
                    </div>
                </div>
            </section>

            {/* ── Stats strip ── */}
            <section className="stats">
                <div className="container stats__inner">
                    {stats.map((s, i) => (
                        <div key={i} className="stats__item">
                            <span className="stats__val">{s.value}</span>
                            <span className="stats__label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features bento ── */}
            <section className="container home__section">
                <div className="section-header">
                    <span className="section-tag">Features</span>
                    <h2>Everything you need to build</h2>
                </div>
                <div className="bento">
                    {features.map((f, i) => (
                        <div key={i} className={`bento__card${f.span ? ' bento__card--wide' : ''}`}>
                            <span className="bento__icon">{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Categories ── */}
            <section className="container home__section">
                <div className="section-header">
                    <span className="section-tag">Categories</span>
                    <h2>Browse by component type</h2>
                </div>
                <div className="cat-row">
                    {Object.entries(CATEGORIES).map(([slug, cat]) => (
                        <Link key={slug} to={`/browse?category=${slug}`} className="cat-pill">
                            <span className="cat-pill__abbr">{cat.abbr}</span>
                            <span className="cat-pill__name">{cat.name}</span>
                            <FiArrowRight size={12} className="cat-pill__arrow" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="container home__section">
                <div className="section-header">
                    <span className="section-tag">How It Works</span>
                    <h2>Three steps to your dream build</h2>
                </div>
                <div className="timeline">
                    {steps.map((s, i) => (
                        <div key={i} className="timeline__step">
                            <span className="timeline__num">{s.n}</span>
                            <div className="timeline__content">
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta-banner">
                <div className="container cta-banner__inner">
                    <div>
                        <h2>Ready to build?</h2>
                        <p>It&apos;s free. No account required.</p>
                    </div>
                    <Link to="/builder" className="btn btn-primary btn-lg">
                        Launch Builder <FiArrowRight size={15} />
                    </Link>
                </div>
            </section>
        </main>
    )
}
