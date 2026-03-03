import { useState, useEffect } from 'react'
import { API, timeAgo } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { FiPlus, FiSearch, FiChevronUp, FiChevronDown, FiX, FiMessageCircle, FiUser, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import './Forum.css'

const categories = ['All', 'Build Help', 'Troubleshooting', 'Discussion', 'Showcase', 'Deals']

export default function Forum() {
    const { user } = useAuth()
    const [threads, setThreads] = useState([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('All')
    const [search, setSearch] = useState('')
    const [activeThread, setActiveThread] = useState(null)
    const [showNewThread, setShowNewThread] = useState(false)
    const [newThread, setNewThread] = useState({ title: '', content: '', category: 'Discussion' })
    const [newReply, setNewReply] = useState('')

    useEffect(() => { loadThreads() }, [category])

    const loadThreads = async () => {
        setLoading(true)
        try { setThreads(await API.getThreads({ category: category === 'All' ? '' : category })) }
        catch { setThreads([]) }
        finally { setLoading(false) }
    }

    const openThread = async (id) => { try { setActiveThread(await API.getThread(id)) } catch { toast.error('Failed to load thread') } }

    const handleCreateThread = async (e) => {
        e.preventDefault()
        if (!user) return toast.error('Please login')
        try { await API.createThread(newThread); setNewThread({ title: '', content: '', category: 'Discussion' }); setShowNewThread(false); loadThreads(); toast.success('Thread created!') }
        catch (err) { toast.error('Failed: ' + err.message) }
    }

    const handleReply = async (e) => {
        e.preventDefault()
        if (!user) return toast.error('Please login')
        try { await API.createReply(activeThread.id, newReply); setNewReply(''); openThread(activeThread.id); toast.success('Reply posted!') }
        catch (err) { toast.error('Failed: ' + err.message) }
    }

    const handleVoteThread = async (id, type) => {
        if (!user) return toast.error('Please login')
        try { await API.voteThread(id, type); if (activeThread?.id === id) openThread(id); loadThreads() }
        catch (err) { toast.error(err.message) }
    }

    const handleVoteReply = async (id, type) => {
        if (!user) return toast.error('Please login')
        try { await API.voteReply(id, type); if (activeThread) openThread(activeThread.id) }
        catch (err) { toast.error(err.message) }
    }

    const filtered = threads.filter(t => !search || t.title?.toLowerCase().includes(search.toLowerCase()))
    const getAuthor = (t) => t.author?.username || t.author_username || 'Unknown'

    return (
        <main className="page">
            <div className="container">
                <header className="fm-header">
                    <div>
                        <h1>Community Forum</h1>
                        <p className="fm-header__sub">Ask questions, share builds, and help fellow builders.</p>
                    </div>
                    {user ? <button className="btn btn-primary" onClick={() => setShowNewThread(true)}><FiPlus size={14} /> New Thread</button>
                        : <Link to="/login" className="btn btn-primary">Login to Post</Link>}
                </header>

                <div className="fm-toolbar">
                    <div className="fm-search"><FiSearch className="fm-search__icon" /><input type="text" placeholder="Search threads..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <div className="fm-chips">{categories.map(cat => <button key={cat} className={`chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
                </div>

                <span className="fm-count">{threads.length} threads</span>

                <section className="fm-list">
                    {loading ? <p className="text-muted">Loading...</p>
                        : filtered.length === 0 ? <div className="fm-empty"><FiMessageCircle size={32} /><h3>No threads found</h3><p>{search ? 'Try a different term.' : 'Start a discussion!'}</p></div>
                        : filtered.map(thread => (
                            <article key={thread.id} className="fm-thread">
                                <div className="fm-votes">
                                    <button className="fm-vote" onClick={() => handleVoteThread(thread.id, 'upvote')}><FiChevronUp size={16} /></button>
                                    <span className="fm-vote__count">{(thread.upvotes || 0) - (thread.downvotes || 0)}</span>
                                    <button className="fm-vote" onClick={() => handleVoteThread(thread.id, 'downvote')}><FiChevronDown size={16} /></button>
                                </div>
                                <div className="fm-thread__main" onClick={() => openThread(thread.id)}>
                                    <div className="fm-thread__top">
                                        <span className="fm-thread__cat">{thread.category}</span>
                                        <h3>{thread.title}</h3>
                                    </div>
                                    <div className="fm-thread__meta">
                                        <span><FiUser size={12} /> {getAuthor(thread)}</span>
                                        <span><FiMessageCircle size={12} /> {thread.reply_count || 0}</span>
                                        <span><FiClock size={12} /> {timeAgo(thread.created_at)}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                </section>

                {showNewThread && (
                    <div className="modal-overlay" onClick={() => setShowNewThread(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2>New Thread</h2><button className="modal-close" onClick={() => setShowNewThread(false)}><FiX /></button></div>
                            <form className="modal-body" onSubmit={handleCreateThread}>
                                <div className="form-group"><label>Title</label><input type="text" value={newThread.title} onChange={e => setNewThread(p => ({ ...p, title: e.target.value }))} required placeholder="Your question or topic" /></div>
                                <div className="form-group"><label>Category</label><select value={newThread.category} onChange={e => setNewThread(p => ({ ...p, category: e.target.value }))}>{categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div className="form-group"><label>Content</label><textarea rows="5" value={newThread.content} onChange={e => setNewThread(p => ({ ...p, content: e.target.value }))} required placeholder="Details, specs, context..." /></div>
                                <button type="submit" className="btn btn-primary">Post Thread</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeThread && (
                    <div className="modal-overlay" onClick={() => setActiveThread(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2>{activeThread.title}</h2><button className="modal-close" onClick={() => setActiveThread(null)}><FiX /></button></div>
                            <div className="modal-body">
                                <div className="fm-detail">
                                    <div className="fm-detail__meta">
                                        <span className="fm-thread__cat">{activeThread.category}</span>
                                        <span><FiUser size={12} /> {getAuthor(activeThread)}</span>
                                        <span><FiClock size={12} /> {timeAgo(activeThread.created_at)}</span>
                                    </div>
                                    <div className="fm-detail__votes">
                                        <button className="fm-vote" onClick={() => handleVoteThread(activeThread.id, 'upvote')}><FiChevronUp size={16} /></button>
                                        <span className="fm-vote__count">{(activeThread.upvotes || 0) - (activeThread.downvotes || 0)}</span>
                                        <button className="fm-vote" onClick={() => handleVoteThread(activeThread.id, 'downvote')}><FiChevronDown size={16} /></button>
                                    </div>
                                    <p className="fm-detail__body">{activeThread.content}</p>
                                </div>
                                <div className="fm-replies">
                                    <h4><FiMessageCircle size={14} /> {activeThread.replies?.length || 0} Replies</h4>
                                    {activeThread.replies?.map(r => (
                                        <div key={r.id} className="fm-reply">
                                            <div className="fm-votes fm-votes--sm">
                                                <button className="fm-vote" onClick={() => handleVoteReply(r.id, 'upvote')}><FiChevronUp size={14} /></button>
                                                <span className="fm-vote__count">{(r.upvotes || 0) - (r.downvotes || 0)}</span>
                                                <button className="fm-vote" onClick={() => handleVoteReply(r.id, 'downvote')}><FiChevronDown size={14} /></button>
                                            </div>
                                            <div className="fm-reply__content">
                                                <div className="fm-reply__meta"><strong>{r.author?.username || r.author_username}</strong><span>{timeAgo(r.created_at)}</span></div>
                                                <p>{r.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {user ? (
                                    <form className="fm-reply-form" onSubmit={handleReply}>
                                        <textarea rows="3" value={newReply} onChange={e => setNewReply(e.target.value)} required placeholder="Write a reply..." />
                                        <button type="submit" className="btn btn-primary">Post Reply</button>
                                    </form>
                                ) : <div className="fm-login-prompt"><Link to="/login" className="btn btn-primary">Login to Reply</Link></div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
