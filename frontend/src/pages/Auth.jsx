import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Auth({ isRegister = false }) {
    const navigate = useNavigate()
    const { login, register } = useAuth()
    const [mode, setMode] = useState(isRegister ? 'register' : 'login')
    const [form, setForm] = useState({ email: '', username: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (mode === 'register') {
                await register(form.email, form.username, form.password)
                setMode('login')
                setError('')
                alert('Registration successful! Please login.')
            } else {
                await login(form.email, form.password)
                navigate('/')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    return (
        <main className="page-content auth-page">
            <div className="auth-container">
                <div className="auth-card card">
                    <div className="auth-header">
                        <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <p>
                            {mode === 'login'
                                ? 'Sign in to save builds and join discussions'
                                : 'Join PCease to build your dream PC'
                            }
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => updateForm('email', e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        {mode === 'register' && (
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={e => updateForm('username', e.target.value)}
                                    required
                                    placeholder="Choose a username"
                                    minLength="3"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => updateForm('password', e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength="6"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        {mode === 'login' ? (
                            <p>Don't have an account? <button onClick={() => setMode('register')}>Sign up</button></p>
                        ) : (
                            <p>Already have an account? <button onClick={() => setMode('login')}>Sign in</button></p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
