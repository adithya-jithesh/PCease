import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API, formatPrice } from '../services/api'
import toast from 'react-hot-toast'
import './Advisor.css'

const useCases = [
    { id: 'gaming', name: 'Gaming', icon: '🎮', desc: 'High FPS, ray tracing' },
    { id: 'content', name: 'Content Creation', icon: '🎬', desc: 'Video editing, 3D rendering' },
    { id: 'streaming', name: 'Streaming', icon: '📡', desc: 'Game + stream simultaneously' },
    { id: 'productivity', name: 'Productivity', icon: '💼', desc: 'Office, coding, multitasking' },
]

export default function Advisor() {
    const [tab, setTab] = useState('recommend') // recommend | ask | templates
    const [budget, setBudget] = useState(60000)
    const [useCase, setUseCase] = useState('gaming')
    const [preferences, setPreferences] = useState('')
    const [loading, setLoading] = useState(false)
    const [recommendation, setRecommendation] = useState(null)
    const [templates, setTemplates] = useState(null)

    // AI Chat
    const [question, setQuestion] = useState('')
    const [chatHistory, setChatHistory] = useState([])
    const [asking, setAsking] = useState(false)

    useEffect(() => {
        API.getTemplates().then(setTemplates).catch(() => {})
    }, [])

    const getRecommendation = async () => {
        setLoading(true)
        setRecommendation(null)
        try {
            const data = await API.getRecommendation(budget, useCase, preferences)
            setRecommendation(data)
        } catch (e) {
            toast.error('Failed to get recommendation: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const askQuestion = async (e) => {
        e.preventDefault()
        if (!question.trim()) return
        setAsking(true)
        const q = question
        setChatHistory(prev => [...prev, { role: 'user', content: q }])
        setQuestion('')
        try {
            const data = await API.askAI(q)
            setChatHistory(prev => [...prev, { role: 'ai', content: data.answer, source: data.source }])
        } catch {
            setChatHistory(prev => [...prev, { role: 'ai', content: 'Sorry, I could not process your question. Please try again.', source: 'error' }])
        } finally {
            setAsking(false)
        }
    }

    const totalPrice = recommendation?.components?.reduce((s, c) => s + (c.price || c.est_price || 0), 0) || 0

    return (
        <main className="page-content">
            <div className="container">
                <header className="advisor-header">
                    <h1>🤖 AI Build Advisor</h1>
                    <p>Get AI-powered PC recommendations, ask questions, or pick from pre-built templates.</p>
                </header>

                {/* Tabs */}
                <div className="advisor-tabs">
                    <button className={`tab ${tab === 'recommend' ? 'active' : ''}`} onClick={() => setTab('recommend')}>
                        💡 Get Recommendation
                    </button>
                    <button className={`tab ${tab === 'ask' ? 'active' : ''}`} onClick={() => setTab('ask')}>
                        💬 Ask AI
                    </button>
                    <button className={`tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
                        📋 Templates
                    </button>
                </div>

                {/* ===== Recommendation Tab ===== */}
                {tab === 'recommend' && (
                    <div className="advisor-layout">
                        <section className="advisor-form card">
                            <h3>Tell us about your build</h3>

                            <div className="form-group">
                                <label>Budget</label>
                                <div className="budget-input">
                                    <input
                                        type="range"
                                        min="25000"
                                        max="300000"
                                        step="5000"
                                        value={budget}
                                        onChange={e => setBudget(Number(e.target.value))}
                                    />
                                    <span className="budget-value">₹{budget.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Primary Use Case</label>
                                <div className="use-case-grid">
                                    {useCases.map(uc => (
                                        <button
                                            key={uc.id}
                                            className={`use-case-card ${useCase === uc.id ? 'active' : ''}`}
                                            onClick={() => setUseCase(uc.id)}
                                        >
                                            <span className="uc-icon">{uc.icon}</span>
                                            <strong>{uc.name}</strong>
                                            <span>{uc.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Additional Preferences (optional)</label>
                                <textarea
                                    rows="3"
                                    value={preferences}
                                    onChange={e => setPreferences(e.target.value)}
                                    placeholder="e.g. Prefer AMD, need WiFi, want white theme..."
                                />
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={getRecommendation} disabled={loading}>
                                {loading ? '🔄 Analyzing...' : '⚡ Get Recommendations'}
                            </button>
                        </section>

                        {recommendation && (
                            <section className="recommendation card">
                                <div className="rec-header">
                                    <h2>{recommendation.title || recommendation.name}</h2>
                                    <span className="rec-source">
                                        {recommendation.source === 'template' ? '📋 Template' : '🤖 AI Generated'}
                                    </span>
                                </div>
                                <p className="rec-desc">{recommendation.description}</p>

                                <ul className="rec-list">
                                    {(recommendation.components || []).map((comp, i) => (
                                        <li key={i}>
                                            <span className="rec-cat">{comp.category}</span>
                                            <span className="rec-name">{comp.name || comp.suggestion}</span>
                                            <span className="rec-price">
                                                {formatPrice(comp.price || comp.est_price)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {comp => comp.reason && <p className="rec-reason">{comp.reason}</p>}

                                <div className="rec-total">
                                    <span>Estimated Total</span>
                                    <span className="total-value">
                                        {formatPrice(recommendation.total || totalPrice)}
                                    </span>
                                </div>

                                {recommendation.tips && (
                                    <div className="rec-tips">
                                        <h4>💡 Tips</h4>
                                        <ul>
                                            {recommendation.tips.map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {recommendation.performance_notes && (
                                    <p className="rec-perf">
                                        <strong>Performance:</strong> {recommendation.performance_notes}
                                    </p>
                                )}

                                <Link to="/builder" className="btn btn-primary">
                                    Open in Builder →
                                </Link>
                            </section>
                        )}
                    </div>
                )}

                {/* ===== Ask AI Tab ===== */}
                {tab === 'ask' && (
                    <div className="chat-section">
                        <div className="chat-messages card">
                            {chatHistory.length === 0 ? (
                                <div className="chat-empty">
                                    <span className="chat-empty-icon">🤖</span>
                                    <h3>Ask PCease AI</h3>
                                    <p>Ask any PC building question. I'm here to help!</p>
                                    <div className="chat-suggestions">
                                        {[
                                            'Best GPU under ₹30,000?',
                                            'Is DDR5 worth it in 2026?',
                                            'Ryzen 5 7600 vs i5-14400F?',
                                            'Best gaming PC build for ₹60K?',
                                        ].map((s, i) => (
                                            <button key={i} className="chat-suggestion" onClick={() => { setQuestion(s); }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                chatHistory.map((msg, i) => (
                                    <div key={i} className={`chat-msg ${msg.role}`}>
                                        <span className="msg-avatar">{msg.role === 'user' ? '🧑' : '🤖'}</span>
                                        <div className="msg-content">
                                            <pre>{msg.content}</pre>
                                        </div>
                                    </div>
                                ))
                            )}
                            {asking && (
                                <div className="chat-msg ai">
                                    <span className="msg-avatar">🤖</span>
                                    <div className="msg-content typing">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <form className="chat-input" onSubmit={askQuestion}>
                            <input
                                type="text"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="Ask a PC building question..."
                                disabled={asking}
                            />
                            <button type="submit" className="btn btn-primary" disabled={asking || !question.trim()}>
                                Send
                            </button>
                        </form>
                    </div>
                )}

                {/* ===== Templates Tab ===== */}
                {tab === 'templates' && (
                    <div className="templates-grid">
                        {templates ? Object.entries(templates).map(([key, tmpl]) => (
                            <div key={key} className="template-card card">
                                <div className="template-header">
                                    <h3>{tmpl.name}</h3>
                                    <span className="template-budget">{formatPrice(tmpl.budget)}</span>
                                </div>
                                <p className="template-desc">{tmpl.description}</p>
                                <ul className="template-parts">
                                    {tmpl.components?.map((c, i) => (
                                        <li key={i}>
                                            <span>{c.category}</span>
                                            <span>{c.suggestion}</span>
                                            <span>{formatPrice(c.est_price)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/builder" className="btn btn-primary btn-sm">
                                    Use Template →
                                </Link>
                            </div>
                        )) : (
                            <div className="loading">Loading templates...</div>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
