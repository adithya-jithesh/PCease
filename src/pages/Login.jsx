import React, { useState } from 'react'
import '../styles/login.css'
import { login as doLogin, register as doRegister } from '../lib/auth.js'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [search] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirect = search.get('redirect') || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (form.password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        await doRegister(form.username.trim(), form.password)
      }
      await doLogin(form.username.trim(), form.password)
      navigate(redirect)
    } catch (err) {
      setError(err.message || `${mode === 'login' ? 'Login' : 'Registration'} failed`)
    }
    setLoading(false)
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{mode === 'login' ? 'Sign in to save builds and join discussions' : 'Join the PCease community'}</p>
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Login
          </button>
          <button
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Register
          </button>
        </div>

        <div className="login-body">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 6 : undefined}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="login-footer">
          {mode === 'login' ? (
            <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setError('') }}>Sign up</a></p>
          ) : (
            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError('') }}>Sign in</a></p>
          )}
        </div>
      </div>
    </main>
  )
}
