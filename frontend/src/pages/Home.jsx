import { Link } from 'react-router-dom'
import { FiDollarSign, FiLink, FiCpu, FiZap, FiActivity, FiMessageCircle, FiArrowRight } from 'react-icons/fi'
import { CATEGORIES } from '../services/api'
import './Home.css'

const features = [
    { icon: <FiDollarSign />, title: 'Price Comparison', desc: 'Real-time prices from 7+ Indian retailers including Amazon, Flipkart, and MDComputers.' },
    { icon: <FiLink />, title: 'Shareable Builds', desc: 'Share your PC build with anyone via a unique link. No login needed to view.' },
    { icon: <FiCpu />, title: 'AI Advisor', desc: 'Budget-based component recommendations powered by Google Gemini AI.' },
    { icon: <FiZap />, title: 'Wattage Calculator', desc: 'Estimate power draw and get PSU recommendations for your build.' },
    { icon: <FiActivity />, title: 'Bottleneck Analyzer', desc: 'Detect CPU-GPU imbalances before purchasing. Build smarter.' },
    { icon: <FiMessageCircle />, title: 'Community Forum', desc: 'Ask questions, share configs, and get help from Indian PC builders.' },
]

const steps = [
    { n: '01', title: 'Pick components', desc: 'Browse parts with live prices from Indian retailers.' },
    { n: '02', title: 'Check compatibility', desc: 'Auto socket, power, and form factor validation.' },
    { n: '03', title: 'Share & save', desc: 'Copy a shareable link or save to your account.' },
]

export default function Home() {
    return (
        <main className="page home">
            <section className="hero">
                <div className="container hero__inner">
                    <span className="hero__badge">India-focused PC building platform</span>
                    <h1>Build smarter.<br /><span className="text-gradient">Compare prices across India.</span></h1>
                    <p className="hero__desc">Browse components, compare prices from 7+ retailers, get AI recommendations, and share your build — all free.</p>
                    <div className="hero__cta">
                        <Link to="/builder" className="btn btn-primary btn-lg">Start Building <FiArrowRight size={16} /></Link>
                        <Link to="/browse" className="btn btn-lg">Browse Parts</Link>
                    </div>
                </div>
            </section>

            <section className="container home__section">
                <h2>Features</h2>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card">
                            <span className="feature-card__icon">{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container home__section">
                <h2>Categories</h2>
                <div className="cat-grid">
                    {Object.entries(CATEGORIES).map(([slug, cat]) => (
                        <Link key={slug} to={`/browse?category=${slug}`} className="cat-card">
                            <span className="cat-card__abbr">{cat.abbr}</span>
                            <span className="cat-card__name">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="container home__section">
                <h2>How it works</h2>
                <div className="steps-grid">
                    {steps.map((s, i) => (
                        <div key={i} className="step-card">
                            <span className="step-card__num">{s.n}</span>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="cta">
                <div className="container cta__inner">
                    <h2>Ready to build?</h2>
                    <p>Start your PC build now — it's completely free.</p>
                    <div className="cta__btns">
                        <Link to="/builder" className="btn btn-primary btn-lg">Launch Builder <FiArrowRight size={16} /></Link>
                        <Link to="/register" className="btn btn-lg">Create Account</Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
