import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiDollarSign, FiCpu, FiLink, FiMessageCircle } from 'react-icons/fi'
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

    const features = [
        { icon: <FiDollarSign />, title: 'Price Comparison', desc: 'Compare across 7+ Indian retailers' },
        { icon: <FiCpu />, title: 'AI Build Advisor', desc: 'Get smart recommendations' },
        { icon: <FiLink />, title: 'Shareable Builds', desc: 'Share builds with a single link' },
        { icon: <FiMessageCircle />, title: 'Community Forum', desc: 'Get help from fellow builders' },
    ]

    return (
        <main className="page au">
            <div className="au-container">
                <div className="au-brand">
                    <h2 className="au-logo">PCease<span>.</span></h2>
                    <p className="au-tagline">Build your dream PC with confidence</p>
                    <div className="au-features">
                        {features.map((f, i) => (
                            <div key={i} className="au-feature">
                                <span className="au-feature__icon">{f.icon}</span>
                                <div>
                                    <strong>{f.title}</strong>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="au-card">
                    <div className="au-tabs">
                        <button className={`au-tab ${mode === 'login' ? 'au-tab--active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
                        <button className={`au-tab ${mode === 'register' ? 'au-tab--active' : ''}`} onClick={() => setMode('register')}>Sign Up</button>
                    </div>

                    <div className="au-header">
                        <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <p>{mode === 'login' ? 'Sign in to your PCease account' : 'Join PCease and start building'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="au-form">
                        <div className="au-field">
                            <label className="au-label"><FiMail size={14} /> Email</label>
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
                            <div className="au-field">
                                <label className="au-label"><FiUser size={14} /> Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={e => updateForm('username', e.target.value)}
                                    required
                                    placeholder="Choose a username"
                                    minLength="3"
                                    autoComplete="username"
                                />
                            </div>
                        )}

                        <div className="au-field">
                            <label className="au-label"><FiLock size={14} /> Password</label>
                            <div className="au-pw">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => updateForm('password', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength="6"
                                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                />
                                <button type="button" className="au-pw__toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary au-submit" disabled={loading}>
                            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                            {!loading && <FiArrowRight size={16} />}
                        </button>
                    </form>

                    <p className="au-footer">
                        By signing up, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </main>
    )
}
