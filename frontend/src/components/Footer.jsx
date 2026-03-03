import { Link } from 'react-router-dom'
import { FiGithub } from 'react-icons/fi'
import './Footer.css'

const links = [
    { to: '/browse', label: 'Browse' },
    { to: '/builder', label: 'Builder' },
    { to: '/advisor', label: 'Advisor' },
    { to: '/forum', label: 'Forum' },
]

export default function Footer() {
    return (
        <footer className="ft">
            <div className="container ft__inner">
                <Link to="/" className="ft__logo">PC<span className="ft__accent">ease</span><span className="ft__dot">.</span></Link>
                <div className="ft__links">
                    {links.map(l => (
                        <Link key={l.to} to={l.to}>{l.label}</Link>
                    ))}
                    <a href="https://github.com/vaibhavshiroorkar/pcease" target="_blank" rel="noreferrer">
                        <FiGithub size={12} /> GitHub
                    </a>
                </div>
                <span className="ft__copy">&copy; {new Date().getFullYear()} PCease</span>
            </div>
        </footer>
    )
}
