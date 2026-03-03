import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { API, formatPrice, getLowestPrice, getHighestPrice, getBestVendor, getSavings } from '../services/api'
import toast from 'react-hot-toast'
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

    if (loading) return <main className="page-content"><div className="container"><div className="loading">Loading comparison...</div></div></main>

    if (!items.length || items.length < 2) {
        return (
            <main className="page-content">
                <div className="container">
                    <div className="compare-empty">
                        <span className="empty-icon">⚖️</span>
                        <h2>Compare Components</h2>
                        <p>Select 2-4 components from the <Link to="/browse">Browse</Link> page to compare them side by side.</p>
                        <Link to="/browse" className="btn btn-primary">Browse Components</Link>
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

    // Collect all spec keys across items
    const allSpecKeys = [...new Set(items.flatMap(i => Object.keys(getSpecs(i))))]

    const getPrices = (item) => item.prices || []
    const lowestIdx = items.reduce((best, item, idx) => {
        const lo = getLowestPrice(item)
        const bestLo = getLowestPrice(items[best])
        return lo < bestLo ? idx : best
    }, 0)

    return (
        <main className="page-content">
            <div className="container">
                <header className="compare-header">
                    <h1>⚖️ Component Comparison</h1>
                    <p>Side-by-side comparison of {items.length} components</p>
                    <Link to="/browse" className="btn btn-secondary">+ Add More</Link>
                </header>

                <div className="compare-table-wrap">
                    <table className="compare-table">
                        <thead>
                            <tr>
                                <th className="label-col">Component</th>
                                {items.map((item, i) => (
                                    <th key={i} className={i === lowestIdx ? 'best' : ''}>
                                        {i === lowestIdx && <span className="best-badge">Best Price</span>}
                                        <div className="comp-name">{item.name}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Image row */}
                            <tr>
                                <td className="label-col">Image</td>
                                {items.map((item, i) => (
                                    <td key={i}>
                                        <div className="comp-img">
                                            {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span className="no-img">📦</span>}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Basic info rows */}
                            {specKeys.map(sk => (
                                <tr key={sk.key}>
                                    <td className="label-col">{sk.label}</td>
                                    {items.map((item, i) => (
                                        <td key={i}>
                                            {sk.key === 'category_name'
                                                ? (item.category?.name || item.category_name || '—')
                                                : sk.key === 'specifications'
                                                ? <span className="spec-mini">{JSON.stringify(getSpecs(item)).slice(0, 80)}...</span>
                                                : (item[sk.key] || '—')
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Dynamic spec rows */}
                            {allSpecKeys.map(key => (
                                <tr key={key}>
                                    <td className="label-col">{key.replace(/_/g, ' ')}</td>
                                    {items.map((item, i) => (
                                        <td key={i}>{getSpecs(item)[key] || '—'}</td>
                                    ))}
                                </tr>
                            ))}

                            {/* Price section */}
                            <tr className="section-row">
                                <td className="label-col"><strong>💰 Pricing</strong></td>
                                {items.map((_, i) => <td key={i}></td>)}
                            </tr>
                            <tr>
                                <td className="label-col">Lowest Price</td>
                                {items.map((item, i) => (
                                    <td key={i} className={i === lowestIdx ? 'best-price' : ''}>
                                        <strong>{formatPrice(getLowestPrice(item))}</strong>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="label-col">Highest Price</td>
                                {items.map((item, i) => (
                                    <td key={i}>{formatPrice(getHighestPrice(item))}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="label-col">Best Vendor</td>
                                {items.map((item, i) => (
                                    <td key={i}>{getBestVendor(item)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="label-col">Savings (vs max)</td>
                                {items.map((item, i) => (
                                    <td key={i} className="savings">{formatPrice(getSavings(item))}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="label-col">Available At</td>
                                {items.map((item, i) => (
                                    <td key={i}>
                                        <div className="vendor-list">
                                            {getPrices(item).map((p, j) => (
                                                <div key={j} className="vendor-row">
                                                    <span>{p.vendor?.name || p.vendor_name || 'Store'}</span>
                                                    <span>{formatPrice(p.price)}</span>
                                                    {p.url && <a href={p.url} target="_blank" rel="noopener" className="buy-link">Buy →</a>}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Verdict */}
                <section className="compare-verdict card">
                    <h3>🏆 Quick Verdict</h3>
                    <p>
                        <strong>{items[lowestIdx]?.name}</strong> offers the best value at{' '}
                        <strong>{formatPrice(getLowestPrice(items[lowestIdx]))}</strong>
                        {getSavings(items[lowestIdx]) > 0 && (
                            <> — saving you <strong>{formatPrice(getSavings(items[lowestIdx]))}</strong> vs the highest listed price</>
                        )}.
                    </p>
                    <Link to="/builder" className="btn btn-primary">
                        Add to Builder →
                    </Link>
                </section>
            </div>
        </main>
    )
}
