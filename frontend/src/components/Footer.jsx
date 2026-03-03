import { Link } from 'react-router-dom'
import { FiGithub } from 'react-icons/fi'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="ft">
            <div className="container">
                <div className="ft__grid">
                    <div className="ft__brand">
                        <Link to="/" className="ft__logo">PCease<span className="ft__dot">.</span></Link>
                        <p>Compare PC component prices across Indian retailers. Build smarter.</p>
                    </div>
                    <div className="ft__col">
                        <span className="ft__heading">Platform</span>
                        <Link to="/browse">Browse</Link>
                        <Link to="/builder">Builder</Link>
                        <Link to="/advisor">Advisor</Link>
                        <Link to="/compare">Compare</Link>
                    </div>
                    <div className="ft__col">
                        <span className="ft__heading">Community</span>
                        <Link to="/forum">Forum</Link>
                        <a href="https://github.com/vaibhavshiroorkar/pcease" target="_blank" rel="noreferrer"><FiGithub size={12} /> GitHub</a>
                    </div>
                    <div className="ft__col">
                        <span className="ft__heading">Retailers</span>
                        <a href="https://amazon.in" target="_blank" rel="noreferrer">Amazon.in</a>
                        <a href="https://flipkart.com" target="_blank" rel="noreferrer">Flipkart</a>
                        <a href="https://mdcomputers.in" target="_blank" rel="noreferrer">MDComputers</a>
                        <a href="https://primeabgb.com" target="_blank" rel="noreferrer">PrimeABGB</a>
                    </div>
                </div>
                <div className="ft__bottom">
                    <p>&copy; {new Date().getFullYear()} PCease</p>
                    <p>FastAPI · React · Supabase</p>
                </div>
            </div>
        </footer>
    )
}
