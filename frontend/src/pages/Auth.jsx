import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Auth({ isRegister = false }) {
    const navigate = useNavigate()
    const { login, register } = useAuth()
    const [mode, setMode] = useState(isRegister ? 'register' : 'login')
    const [form, setForm] = useState({ email: '', username: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (mode === 'register') {
                await register(form.email, form.username, form.password)
                setMode('login')
                toast.success('Account created! Please sign in.')
            } else {
                await login(form.email, form.password)
                toast.success('Welcome back!')
                navigate('/')
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

    return (
        <main className="page-content auth-page">
            <div className="auth-container">
                <div className="auth-brand">
                    <h2>PC<span className="accent">ease</span></h2>
                    <p>Build your dream PC with confidence</p>
                    <div className="auth-features">
                        <div className="auth-feature">
                            <span>💰</span>
                            <div>
                                <strong>Price Comparison</strong>
                                <p>Compare across 7+ Indian retailers</p>
                            </div>
                        </div>
                        <div className="auth-feature">
                            <span>🤖</span>
                            <div>
                                <strong>AI Build Advisor</strong>
                                <p>Get smart recommendations</p>
                            </div>
                        </div>
                        <div className="auth-feature">
                            <span>🔗</span>
                            <div>
                                <strong>Shareable Builds</strong>
                                <p>Share builds with a single link</p>
                            </div>
                        </div>
                        <div className="auth-feature">
                            <span>💬</span>
                            <div>
                                <strong>Community Forum</strong>
                                <p>Get help from fellow builders</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-card card">
                    <div className="auth-tabs">
                        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
                        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Sign Up</button>
                    </div>

                    <div className="auth-header">
                        <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <p>{mode === 'login' ? 'Sign in to your PCease account' : 'Join PCease and start building'}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>📧 Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => updateForm('email', e.target.value)}
                                required
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {mode === 'register' && (
                            <div className="form-group">
                                <label>👤 Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={e => updateForm('username', e.target.value)}
                                    required
                                    placeholder="Choose a cool username"
                                    minLength="3"
                                    autoComplete="username"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>🔒 Password</label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => updateForm('password', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength="6"
                                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                />
                                <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                            {loading ? '⏳ Please wait...' : mode === 'login' ? '🚀 Sign In' : '✨ Create Account'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button className="btn btn-google" disabled>
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continue with Google (Coming Soon)
                    </button>

                    <p className="auth-footer-text">
                        By signing up, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </main>
    )
}
