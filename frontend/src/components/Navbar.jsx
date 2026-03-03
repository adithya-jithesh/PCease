import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navItems = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse' },
    { to: '/builder', label: 'Builder' },
    { to: '/advisor', label: 'AI Advisor' },
    { to: '/compare', label: 'Compare' },
    { to: '/forum', label: 'Forum' },
]

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { user, logout } = useAuth()
    const location = useLocation()

    useEffect(() => { setMobileOpen(false) }, [location])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-inner">
                <Link to="/" className="logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">
                        <span className="logo-accent">PC</span>ease
                    </span>
                    <span className="logo-badge">IN</span>
                </Link>

                <button
                    className="mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`hamburger ${mobileOpen ? 'open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>

                <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
                    {navItems.map(item => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) => isActive ? 'active' : ''}
                                end={item.to === '/'}
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                    <li className="nav-auth">
                        {user ? (
                            <div className="user-menu">
                                <span className="user-avatar">
                                    {user.username?.charAt(0).toUpperCase()}
                                </span>
                                <span className="user-name">{user.username}</span>
                                <button className="btn-logout" onClick={logout}>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <NavLink to="/login" className="nav-login-btn">
                                Sign In
                            </NavLink>
                        )}
                    </li>
                </ul>
            </div>
        </nav>
    )
}
