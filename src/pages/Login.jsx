import React, { useState } from 'react'
import '../styles/login.css'
import { login as doLogin, register as doRegister } from '../lib/auth.js'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [search] = useSearchParams()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [regForm, setRegForm] = useState({ username: '', password: '' })
  const [regError, setRegError] = useState('')

  const redirect = search.get('redirect') || '/forum'

  const onLogin = async (e) => {
    e.preventDefault()
    try {
      await doLogin(loginForm.username.trim(), loginForm.password)
      navigate(redirect)
    } catch (err) { setLoginError(err.message || 'Login failed') }
  }

  const onRegister = async (e) => {
    e.preventDefault()
    const { username, password } = regForm
    if (!username || !password) { setRegError('Fill all fields'); return }
    if (password.length < 6) { setRegError('Use at least 6 characters'); return }
    try {
      await doRegister(username.trim(), password)
      await doLogin(username.trim(), password)
      navigate(redirect)
    } catch (err) { setRegError(err.message || 'Registration failed') }
  }

  return (
    <main className="container auth-container">
      <div className="auth-card">
        <div className="tabs">
          <button className={"tab-btn "+(tab==='login'?'active':'')} onClick={()=>setTab('login')}>Login</button>
          <button className={"tab-btn "+(tab==='register'?'active':'')} onClick={()=>setTab('register')}>Register</button>
        </div>
        <div className={"tab-panel "+(tab==='login'?'active':'')} id="tab-login">
          <form onSubmit={onLogin}>
            <div className="form-field"><label htmlFor="login-username">Username</label><input id="login-username" value={loginForm.username} onChange={e=>setLoginForm(f=>({...f,username:e.target.value}))} required /></div>
            <div className="form-field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} required /></div>
            <button className="cta-button" type="submit">Login</button>
            <p className="form-note">{loginError}</p>
          </form>
        </div>
        <div className={"tab-panel "+(tab==='register'?'active':'')} id="tab-register">
          <form onSubmit={onRegister}>
            <div className="form-field"><label htmlFor="reg-username">Username</label><input id="reg-username" value={regForm.username} onChange={e=>setRegForm(f=>({...f,username:e.target.value}))} required /></div>
            <div className="form-field"><label htmlFor="reg-password">Password</label><input id="reg-password" type="password" minLength={6} value={regForm.password} onChange={e=>setRegForm(f=>({...f,password:e.target.value}))} required /></div>
            <button className="cta-button" type="submit">Create Account</button>
            <p className="form-note">{regError}</p>
          </form>
        </div>
      </div>
    </main>
  )
}
