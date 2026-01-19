import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Advisor.css'

const useCases = [
    { id: 'gaming', name: 'Gaming', desc: 'High FPS, ray tracing' },
    { id: 'productivity', name: 'Productivity', desc: 'Office, multitasking' },
    { id: 'content', name: 'Content Creation', desc: 'Video editing, 3D' },
    { id: 'budget', name: 'Budget Build', desc: 'Best value for money' }
]

export default function Advisor() {
    const [budget, setBudget] = useState(50000)
    const [useCase, setUseCase] = useState('gaming')
    const [loading, setLoading] = useState(false)
    const [recommendation, setRecommendation] = useState(null)

    const getRecommendation = async () => {
        setLoading(true)
        // Simulated AI recommendation - in production, call backend
        await new Promise(r => setTimeout(r, 1500))

        setRecommendation({
            title: `${useCases.find(u => u.id === useCase)?.name} Build`,
            budget: budget,
            components: [
                { category: 'CPU', name: budget > 80000 ? 'AMD Ryzen 7 7700X' : 'AMD Ryzen 5 5600', price: budget > 80000 ? 28000 : 12000 },
                { category: 'GPU', name: budget > 80000 ? 'RTX 4070' : 'RTX 4060', price: budget > 80000 ? 52000 : 30000 },
                { category: 'RAM', name: '16GB DDR5 5600MHz', price: 5000 },
                { category: 'Motherboard', name: 'B650 Gaming', price: 15000 },
                { category: 'Storage', name: '1TB NVMe SSD', price: 6000 },
                { category: 'PSU', name: '650W 80+ Gold', price: 6000 }
            ]
        })
        setLoading(false)
    }

    const totalPrice = recommendation?.components.reduce((s, c) => s + c.price, 0) || 0

    return (
        <main className="page-content">
            <div className="container">
                <header className="advisor-header">
                    <h1>AI Build Advisor</h1>
                    <p>Tell us your budget and use case. We'll recommend the perfect components.</p>
                </header>

                <div className="advisor-layout">
                    <section className="advisor-form card">
                        <div className="form-group">
                            <label>Your Budget</label>
                            <div className="budget-input">
                                <input
                                    type="range"
                                    min="30000"
                                    max="200000"
                                    step="5000"
                                    value={budget}
                                    onChange={e => setBudget(Number(e.target.value))}
                                />
                                <span className="budget-value">₹{budget.toLocaleString()}</span>
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
                                        <strong>{uc.name}</strong>
                                        <span>{uc.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={getRecommendation}
                            disabled={loading}
                        >
                            {loading ? 'Analyzing...' : 'Get Recommendations'}
                        </button>
                    </section>

                    {recommendation && (
                        <section className="recommendation card">
                            <h2>{recommendation.title}</h2>
                            <p>Optimized for your ₹{recommendation.budget.toLocaleString()} budget</p>

                            <ul className="rec-list">
                                {recommendation.components.map((comp, i) => (
                                    <li key={i}>
                                        <span className="rec-cat">{comp.category}</span>
                                        <span className="rec-name">{comp.name}</span>
                                        <span className="rec-price">₹{comp.price.toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="rec-total">
                                <span>Estimated Total</span>
                                <span className="total-value">₹{totalPrice.toLocaleString()}</span>
                            </div>

                            <Link to="/builder" className="btn btn-primary">
                                Open in Builder →
                            </Link>
                        </section>
                    )}
                </div>
            </div>
        </main>
    )
}
