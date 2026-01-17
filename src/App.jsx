import React from 'react'
import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import Builder from './pages/Builder.jsx'
import Forum from './pages/Forum.jsx'
import Login from './pages/Login.jsx'
import Query from './pages/Query.jsx'
import { useTheme } from './lib/theme.js'
import { AuthNav } from './components/AuthNav.jsx'
import './styles/global.css'

function NavBar() {
  const { theme, toggle } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="brand-logo" onClick={closeMobileMenu}>
          <span>🖥️</span> PCease
        </Link>
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <li>
            <NavLink
              to="/browse"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={closeMobileMenu}
            >
              Browse
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/builder"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={closeMobileMenu}
            >
              PC Builder
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/query"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={closeMobileMenu}
            >
              Build Advisor
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/forum"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={closeMobileMenu}
            >
              Forum
            </NavLink>
          </li>
          <li>
            <button
              id="theme-toggle"
              className="theme-toggle-btn"
              type="button"
              aria-pressed={theme === 'dark'}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              onClick={toggle}
            >
              <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="theme-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </li>
          <li><AuthNav onNavigate={closeMobileMenu} /></li>
        </ul>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <p>
          © {new Date().getFullYear()} PCease — Build your dream PC with confidence.
          <span style={{ opacity: 0.7, marginLeft: '8px' }}>Made in India 🇮🇳</span>
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/login" element={<Login />} />
        <Route path="/query" element={<Query />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  )
}
