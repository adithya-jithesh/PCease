import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getHighestPrice, getBestVendor, getSavings } from '../services/api'
import toast from 'react-hot-toast'
import { FiArrowRight, FiExternalLink, FiAward, FiPackage, FiPlus } from 'react-icons/fi'
import './Compare.css'

const specKeys = [
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'specifications', label: 'Specs' },
    { key: 'category_name', label: 'Category' },
]

export default function Compare() {
    const [searchParams] = useSearchParams()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []
        if (ids.length < 2) {
            setLoading(false)
            return
        }
        API.compareComponents(ids)
            .then(data => setItems(data.components || data))
            .catch(e => toast.error('Failed to load comparison: ' + e.message))
            .finally(() => setLoading(false))
    }, [searchParams])

    if (loading) return <main className="page"><div className="container"><p style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading comparison...</p></div></main>

    if (!items.length || items.length < 2) {
        return (
            <main className="page">
                <div className="container">
                    <div className="cp-empty">
                        <FiPackage size={40} />
                        <h2>Compare Components</h2>
                        <p>Select 2–4 components from the <Link to="/browse">Browse</Link> page to compare them side by side.</p>
                        <Link to="/browse" className="btn btn-primary">Browse Components <FiArrowRight size={16} /></Link>
                    </div>
                </div>
            </main>
        )
    }

    const getSpecs = (item) => {
        if (typeof item.specifications === 'string') {
            try { return JSON.parse(item.specifications) } catch { return {} }
        }
        return item.specifications || {}
    }

    const allSpecKeys = [...new Set(items.flatMap(i => Object.keys(getSpecs(i))))]

    const getPrices = (item) => item.prices || []
    const lowestIdx = items.reduce((best, item, idx) => {
        const lo = getLowestPrice(item)
        const bestLo = getLowestPrice(items[best])
        return lo < bestLo ? idx : best
    }, 0)

    return (
        <main className="page">
            <div className="container">
                <header className="cp-header">
                    <div>
                        <h1>Component Comparison</h1>
                        <p className="cp-header__sub">Side-by-side comparison of {items.length} components</p>
                    </div>
                    <Link to="/browse" className="btn btn-secondary"><FiPlus size={16} /> Add More</Link>
                </header>

                <div className="cp-table-wrap">
                    <table className="cp-table">
                        <thead>
                            <tr>
                                <th className="cp-label">Component</th>
                                {items.map((item, i) => (
                                    <th key={i} className={i === lowestIdx ? 'cp-best' : ''}>
                                        {i === lowestIdx && <span className="cp-badge">Best Price</span>}
                                        <div className="cp-name">{item.name}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="cp-label">Image</td>
                                {items.map((item, i) => (
                                    <td key={i}>
                                        <div className="cp-img">
                                            {item.image_url ? <img src={item.image_url} alt={item.name} /> : <FiPackage size={28} />}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {specKeys.map(sk => (
                                <tr key={sk.key}>
                                    <td className="cp-label">{sk.label}</td>
                                    {items.map((item, i) => (
                                        <td key={i}>
                                            {sk.key === 'category_name'
                                                ? (item.category?.name || item.category_name || '—')
                                                : sk.key === 'specifications'
                                                ? <span className="cp-spec-mini">{JSON.stringify(getSpecs(item)).slice(0, 80)}...</span>
                                                : (item[sk.key] || '—')
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {allSpecKeys.map(key => (
                                <tr key={key}>
                                    <td className="cp-label">{key.replace(/_/g, ' ')}</td>
                                    {items.map((item, i) => (
                                        <td key={i}>{getSpecs(item)[key] || '—'}</td>
                                    ))}
                                </tr>
                            ))}

                            <tr className="cp-section">
                                <td className="cp-label"><strong>Pricing</strong></td>
                                {items.map((_, i) => <td key={i}></td>)}
                            </tr>
                            <tr>
                                <td className="cp-label">Lowest Price</td>
                                {items.map((item, i) => (
                                    <td key={i} className={i === lowestIdx ? 'cp-price--best' : ''}>
                                        <strong>{formatPrice(getLowestPrice(item))}</strong>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="cp-label">Highest Price</td>
                                {items.map((item, i) => (
                                    <td key={i}>{formatPrice(getHighestPrice(item))}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="cp-label">Best Vendor</td>
                                {items.map((item, i) => (
                                    <td key={i}>{getBestVendor(item)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="cp-label">Savings</td>
                                {items.map((item, i) => (
                                    <td key={i} className="cp-savings">{formatPrice(getSavings(item))}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="cp-label">Available At</td>
                                {items.map((item, i) => (
                                    <td key={i}>
                                        <div className="cp-vendors">
                                            {getPrices(item).map((p, j) => (
                                                <div key={j} className="cp-vendor">
                                                    <span className="cp-vendor__name">{p.vendor?.name || p.vendor_name || 'Store'}</span>
                                                    <span className="cp-vendor__price">{formatPrice(p.price)}</span>
                                                    {p.url && <a href={p.url} target="_blank" rel="noopener" className="cp-vendor__link"><FiExternalLink size={12} /></a>}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <section className="cp-verdict">
                    <FiAward size={20} className="cp-verdict__icon" />
                    <h3>Quick Verdict</h3>
                    <p>
                        <strong>{items[lowestIdx]?.name}</strong> offers the best value at{' '}
                        <strong>{formatPrice(getLowestPrice(items[lowestIdx]))}</strong>
                        {getSavings(items[lowestIdx]) > 0 && (
                            <> — saving you <strong>{formatPrice(getSavings(items[lowestIdx]))}</strong> vs the highest listed price</>
                        )}.
                    </p>
                    <Link to="/builder" className="btn btn-primary">Add to Builder <FiArrowRight size={16} /></Link>
                </section>
            </div>
        </main>
    )
}
