import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <span className="logo-icon">⚡</span>
                            <span><span className="logo-accent">PC</span>ease</span>
                        </Link>
                        <p className="footer-tagline">
                            India's smartest PC building platform. Compare prices, check
                            compatibility, and get AI-powered recommendations.
                        </p>
                        <div className="footer-badges">
                            <span className="footer-badge">🇮🇳 Made in India</span>
                            <span className="footer-badge">⚡ Open Source</span>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Platform</h4>
                        <Link to="/browse">Browse Parts</Link>
                        <Link to="/builder">PC Builder</Link>
                        <Link to="/advisor">AI Advisor</Link>
                        <Link to="/compare">Compare</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Community</h4>
                        <Link to="/forum">Forum</Link>
                        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                        <a href="https://discord.gg" target="_blank" rel="noreferrer">Discord</a>
                    </div>

                    <div className="footer-col">
                        <h4>Retailers</h4>
                        <a href="https://amazon.in" target="_blank" rel="noreferrer">Amazon.in</a>
                        <a href="https://flipkart.com" target="_blank" rel="noreferrer">Flipkart</a>
                        <a href="https://mdcomputers.in" target="_blank" rel="noreferrer">MDComputers</a>
                        <a href="https://primeabgb.com" target="_blank" rel="noreferrer">PrimeABGB</a>
                        <a href="https://pcstudio.in" target="_blank" rel="noreferrer">PCStudio</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} PCease. Built with ❤️ in India.</p>
                    <p className="footer-stack">FastAPI &bull; React &bull; Supabase &bull; Vercel &bull; Render</p>
                </div>
            </div>
        </footer>
    )
}
