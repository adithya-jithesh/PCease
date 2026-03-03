import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navItems = [
    { to: '/browse', label: 'Browse' },
    { to: '/builder', label: 'Builder' },
    { to: '/advisor', label: 'Advisor' },
    { to: '/compare', label: 'Compare' },
    { to: '/forum', label: 'Forum' },
]

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { user, logout } = useAuth()
    const location = useLocation()

    useEffect(() => { setOpen(false) }, [location])
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', fn)
        return () => window.removeEventListener('scroll', fn)
    }, [])

    return (
        <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
            <div className="container nav__inner">
                <Link to="/" className="nav__logo">
                    PCease<span className="nav__dot">.</span>
                </Link>

                <div className={`nav__links${open ? ' nav__links--open' : ''}`}>
                    {navItems.map(item => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}>
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="nav__right">
                    {user ? (
                        <div className="nav__user">
                            <span className="nav__avatar">{user.username?.charAt(0).toUpperCase()}</span>
                            <span className="nav__username">{user.username}</span>
                            <button className="nav__logout" onClick={logout} title="Logout"><FiLogOut size={15} /></button>
                        </div>
                    ) : (
                        <NavLink to="/login" className="btn btn-primary btn-sm">Sign In</NavLink>
                    )}
                    <button className="nav__toggle" onClick={() => setOpen(!open)} aria-label="Menu">
                        {open ? <FiX size={18} /> : <FiMenu size={18} />}
                    </button>
                </div>
            </div>
        </nav>
    )
}
