import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const { user, logout } = useAuth()
    const location = useLocation()

    useEffect(() => {
        setMobileOpen(false)
    }, [location])

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="logo">
                    <span className="logo-accent">PC</span>ease
                </Link>

                <button
                    className="mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? '✕' : '☰'}
                </button>

                <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
                    <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
                    <li><NavLink to="/browse" className={({ isActive }) => isActive ? 'active' : ''}>Browse</NavLink></li>
                    <li><NavLink to="/builder" className={({ isActive }) => isActive ? 'active' : ''}>Builder</NavLink></li>
                    <li><NavLink to="/advisor" className={({ isActive }) => isActive ? 'active' : ''}>Advisor</NavLink></li>
                    <li><NavLink to="/forum" className={({ isActive }) => isActive ? 'active' : ''}>Forum</NavLink></li>
                    <li>
                        {user ? (
                            <button className="nav-user" onClick={logout}>
                                {user.username} ↗
                            </button>
                        ) : (
                            <NavLink to="/login" className="nav-login">Login</NavLink>
                        )}
                    </li>
                </ul>
            </div>
        </nav>
    )
}
