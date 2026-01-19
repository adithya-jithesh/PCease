import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <span className="logo-accent">PC</span>ease
                    </Link>
                    <p>India's #1 PC Building Platform</p>
                </div>

                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Platform</h4>
                        <Link to="/browse">Browse</Link>
                        <Link to="/builder">Builder</Link>
                        <Link to="/advisor">Advisor</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Community</h4>
                        <Link to="/forum">Forum</Link>
                        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>Made in India • PCease © {new Date().getFullYear()}</p>
                </div>
            </div>
        </footer>
    )
}
