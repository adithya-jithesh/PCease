import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Builder from './pages/Builder'
import Forum from './pages/Forum'
import Login from './pages/Login'
import Query from './pages/Query'
import './styles/global.css'

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <>
      {React.cloneElement(children, { theme, toggleTheme })}
    </>
  )
}

function NavBar({ theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="brand-logo">
          💻 <span>PCease</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/browse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Browse
            </NavLink>
          </li>
          <li>
            <NavLink to="/builder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Builder
            </NavLink>
          </li>
          <li>
            <NavLink to="/query" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Advisor
            </NavLink>
          </li>
          <li>
            <NavLink to="/forum" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Forum
            </NavLink>
          </li>
          <li>
            <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Login
            </NavLink>
          </li>
          <li>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="theme-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          Made with 💜 in India • <strong>PCease</strong> © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}

function AppContent(props) {
  return (
    <>
      <NavBar {...props} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/login" element={<Login />} />
        <Route path="/query" element={<Query />} />
      </Routes>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
