import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSession, isLoggedIn, logout } from '../lib/auth.js'

export function AuthNav({ onNavigate }) {
  const navigate = useNavigate()
  const session = getSession()
  
  const handleLogout = () => {
    logout()
    navigate(0)
  }
  
  if (isLoggedIn()) {
    return (
      <span className="nav-user">
        👋 {session.username} <button className="theme-toggle-btn" onClick={handleLogout}>Logout</button>
      </span>
    )
  }
  return <Link to="/login" className="nav-login-link" onClick={onNavigate}>Login</Link>
}
