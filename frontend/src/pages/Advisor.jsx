import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API, formatPrice } from '../services/api'
import { FiCpu, FiSend, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Advisor.css'

const useCases = [
    { id: 'gaming', name: 'Gaming', desc: 'High FPS, ray tracing' },
    { id: 'content', name: 'Content', desc: 'Video editing, 3D' },
    { id: 'streaming', name: 'Streaming', desc: 'Game + stream' },
    { id: 'productivity', name: 'Productivity', desc: 'Office, coding' },
]

export default function Advisor() {
    const [tab, setTab] = useState('recommend')
    const [budget, setBudget] = useState(60000)
    const [useCase, setUseCase] = useState('gaming')
    const [preferences, setPreferences] = useState('')
    const [loading, setLoading] = useState(false)
    const [recommendation, setRecommendation] = useState(null)
    const [templates, setTemplates] = useState(null)
    const [question, setQuestion] = useState('')
    const [chatHistory, setChatHistory] = useState([])
    const [asking, setAsking] = useState(false)

    useEffect(() => { API.getTemplates().then(setTemplates).catch(() => {}) }, [])

    const getRecommendation = async () => {
        setLoading(true); setRecommendation(null)
        try { setRecommendation(await API.getRecommendation(budget, useCase, preferences)) }
        catch (e) { toast.error('Failed: ' + e.message) }
        finally { setLoading(false) }
    }

    const askQuestion = async (e) => {
        e.preventDefault()
        if (!question.trim()) return
        setAsking(true)
        const q = question
        setChatHistory(p => [...p, { role: 'user', content: q }]); setQuestion('')
        try {
            const d = await API.askAI(q)
            setChatHistory(p => [...p, { role: 'ai', content: d.answer, source: d.source }])
        } catch { setChatHistory(p => [...p, { role: 'ai', content: 'Sorry, could not process. Try again.', source: 'error' }]) }
        finally { setAsking(false) }
    }

    const totalPrice = recommendation?.components?.reduce((s, c) => s + (c.price || c.est_price || 0), 0) || 0

    return (
        <main className="page">
            <div className="container">
                <header className="ad-header">
                    <h1><FiCpu style={{ verticalAlign: 'middle' }} /> AI Build Advisor</h1>
                    <p className="ad-header__sub">Get recommendations, ask questions, or pick from templates.</p>
                </header>

                <div className="ad-tabs">
                    {['recommend', 'ask', 'templates'].map(t => (
                        <button key={t} className={`ad-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                            {t === 'recommend' ? 'Recommend' : t === 'ask' ? 'Ask AI' : 'Templates'}
                        </button>
                    ))}
                </div>

                {tab === 'recommend' && (
                    <div className="ad-layout">
                        <section className="ad-form">
                            <h3>Tell us about your build</h3>
                            <div className="form-group">
                                <label>Budget</label>
                                <div className="ad-budget">
                                    <input type="range" min="25000" max="300000" step="5000" value={budget} onChange={e => setBudget(Number(e.target.value))} />
                                    <span className="ad-budget__val">₹{budget.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Use Case</label>
                                <div className="ad-uc-grid">
                                    {useCases.map(uc => (
                                        <button key={uc.id} className={`ad-uc ${useCase === uc.id ? 'active' : ''}`} onClick={() => setUseCase(uc.id)}>
                                            <strong>{uc.name}</strong><span>{uc.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Preferences (optional)</label>
                                <textarea rows="3" value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="e.g. Prefer AMD, need WiFi..." />
                            </div>
                            <button className="btn btn-primary btn-lg" onClick={getRecommendation} disabled={loading}>
                                {loading ? 'Analyzing...' : 'Get Recommendations'}
                            </button>
                        </section>

                        {recommendation && (
                            <section className="ad-result">
                                <div className="ad-result__head">
                                    <h2>{recommendation.title || recommendation.name}</h2>
                                    <span className="ad-result__src">{recommendation.source === 'template' ? 'Template' : 'AI'}</span>
                                </div>
                                <p className="ad-result__desc">{recommendation.description}</p>
                                <ul className="ad-rec-list">
                                    {(recommendation.components || []).map((comp, i) => (
                                        <li key={i}>
                                            <span className="ad-rec-cat">{comp.category}</span>
                                            <span className="ad-rec-name">{comp.name || comp.suggestion}</span>
                                            <span className="ad-rec-price">{formatPrice(comp.price || comp.est_price)}</span>
                                            {comp.reason && <p className="ad-rec-reason">{comp.reason}</p>}
                                        </li>
                                    ))}
                                </ul>
                                <div className="ad-rec-total">
                                    <span>Total</span>
                                    <span className="ad-rec-total__val">{formatPrice(recommendation.total || totalPrice)}</span>
                                </div>
                                {recommendation.tips && (
                                    <div className="ad-tips">
                                        <h4>Tips</h4>
                                        <ul>{recommendation.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                    </div>
                                )}
                                {recommendation.performance_notes && <p className="ad-perf"><strong>Performance:</strong> {recommendation.performance_notes}</p>}
                                <Link to="/builder" className="btn btn-primary">Open in Builder <FiArrowRight size={14} /></Link>
                            </section>
                        )}
                    </div>
                )}

                {tab === 'ask' && (
                    <div className="ad-chat">
                        <div className="ad-chat__msgs">
                            {chatHistory.length === 0 ? (
                                <div className="ad-chat__empty">
                                    <FiCpu size={32} />
                                    <h3>Ask PCease AI</h3>
                                    <p>Ask any PC building question.</p>
                                    <div className="ad-chat__sugg">
                                        {['Best GPU under ₹30,000?', 'Is DDR5 worth it?', 'Ryzen 5 vs i5-14400F?', 'Best ₹60K gaming PC?'].map((s, i) => (
                                            <button key={i} className="chip" onClick={() => setQuestion(s)}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                            ) : chatHistory.map((msg, i) => (
                                <div key={i} className={`ad-msg ad-msg--${msg.role}`}>
                                    <div className="ad-msg__bubble"><pre>{msg.content}</pre></div>
                                </div>
                            ))}
                            {asking && <div className="ad-msg ad-msg--ai"><div className="ad-msg__bubble ad-msg--typing"><span /><span /><span /></div></div>}
                        </div>
                        <form className="ad-chat__input" onSubmit={askQuestion}>
                            <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..." disabled={asking} />
                            <button type="submit" className="btn btn-primary" disabled={asking || !question.trim()}><FiSend size={14} /></button>
                        </form>
                    </div>
                )}

                {tab === 'templates' && (
                    <div className="ad-tmpl-grid">
                        {templates ? Object.entries(templates).map(([key, tmpl]) => (
                            <div key={key} className="ad-tmpl">
                                <div className="ad-tmpl__head"><h3>{tmpl.name}</h3><span className="ad-tmpl__budget">{formatPrice(tmpl.budget)}</span></div>
                                <p className="ad-tmpl__desc">{tmpl.description}</p>
                                <ul className="ad-tmpl__parts">
                                    {tmpl.components?.map((c, i) => (
                                        <li key={i}><span>{c.category}</span><span>{c.suggestion}</span><span>{formatPrice(c.est_price)}</span></li>
                                    ))}
                                </ul>
                                <Link to="/builder" className="btn btn-primary btn-sm">Use Template <FiArrowRight size={12} /></Link>
                            </div>
                        )) : <p className="text-muted">Loading templates...</p>}
                    </div>
                )}
            </div>
        </main>
    )
}
