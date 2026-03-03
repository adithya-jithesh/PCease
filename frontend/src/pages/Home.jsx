import { Link } from 'react-router-dom'
import { FiArrowRight, FiDollarSign, FiCpu, FiLayers } from 'react-icons/fi'
import { CATEGORIES } from '../services/api'
import './Home.css'

const features = [
    { icon: <FiDollarSign />, title: 'Price Compare', desc: 'Compare prices across 9 Indian retailers in real-time.' },
    { icon: <FiCpu />, title: 'AI Advisor', desc: 'Get smart recommendations based on your budget and use case.' },
    { icon: <FiLayers />, title: 'PC Builder', desc: 'Build your dream PC with compatibility checks and shareable links.' },
]

export default function Home() {
    return (
        <main className="page home">
            {/* Hero */}
            <section className="hero">
                <div className="container hero__inner">
                    <h1>Build smarter. <span className="text-accent">Pay less.</span></h1>
                    <p className="hero__sub">
                        Compare PC component prices across Indian retailers, get AI-powered recommendations, and build your perfect PC.
                    </p>
                    <div className="hero__cta">
                        <Link to="/builder" className="btn btn-primary btn-lg">
                            Start Building <FiArrowRight size={15} />
                        </Link>
                        <Link to="/browse" className="btn btn-lg">Browse Components</Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="home-section">
                <div className="container">
                    <div className="features">
                        {features.map((f, i) => (
                            <div key={i} className="feature">
                                <span className="feature__icon">{f.icon}</span>
                                <div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="home-section home-section--alt">
                <div className="container">
                    <h2 className="home-section__title">Browse Components</h2>
                    <div className="categories">
                        {Object.entries(CATEGORIES).map(([slug, cat]) => (
                            <Link key={slug} to={`/browse?category=${slug}`} className="category">
                                <span className="category__abbr">{cat.abbr}</span>
                                <span className="category__name">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="home-section">
                <div className="container home-cta">
                    <h2>Ready to build your PC?</h2>
                    <p>Start now — it's completely free.</p>
                    <Link to="/builder" className="btn btn-primary btn-lg">
                        Launch Builder <FiArrowRight size={15} />
                    </Link>
                </div>
            </section>
        </main>
    )
}
