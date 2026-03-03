import { useState, useEffect } from 'react'
import { API, timeAgo } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
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
        try {
            const cat = category === 'All' ? '' : category
            const data = await API.getThreads({ category: cat })
            setThreads(data)
        } catch {
            setThreads([])
        } finally {
            setLoading(false)
        }
    }

    const openThread = async (id) => {
        try {
            const data = await API.getThread(id)
            setActiveThread(data)
        } catch {
            toast.error('Failed to load thread')
        }
    }

    const handleCreateThread = async (e) => {
        e.preventDefault()
        if (!user) return toast.error('Please login to create a thread')
        try {
            await API.createThread(newThread)
            setNewThread({ title: '', content: '', category: 'Discussion' })
            setShowNewThread(false)
            loadThreads()
            toast.success('Thread created!')
        } catch (err) {
            toast.error('Failed: ' + err.message)
        }
    }

    const handleReply = async (e) => {
        e.preventDefault()
        if (!user) return toast.error('Please login to reply')
        try {
            await API.createReply(activeThread.id, newReply)
            setNewReply('')
            openThread(activeThread.id)
            toast.success('Reply posted!')
        } catch (err) {
            toast.error('Failed: ' + err.message)
        }
    }

    const handleVoteThread = async (id, type) => {
        if (!user) return toast.error('Please login to vote')
        try {
            await API.voteThread(id, type)
            if (activeThread?.id === id) openThread(id)
            loadThreads()
        } catch (err) {
            toast.error(err.message)
        }
    }

    const handleVoteReply = async (id, type) => {
        if (!user) return toast.error('Please login to vote')
        try {
            await API.voteReply(id, type)
            if (activeThread) openThread(activeThread.id)
        } catch (err) {
            toast.error(err.message)
        }
    }

    const filtered = threads.filter(t =>
        !search || t.title?.toLowerCase().includes(search.toLowerCase())
    )

    const getAuthor = (thread) => thread.author?.username || thread.author_username || 'Unknown'

    return (
        <main className="page-content">
            <div className="container">
                <header className="forum-header">
                    <div>
                        <h1>💬 Community Forum</h1>
                        <p>Ask questions, share builds, discuss deals, and help fellow builders.</p>
                    </div>
                    {user ? (
                        <button className="btn btn-primary" onClick={() => setShowNewThread(true)}>
                            + New Thread
                        </button>
                    ) : (
                        <Link to="/login" className="btn btn-primary">Login to Post</Link>
                    )}
                </header>

                {/* Search & Filters */}
                <div className="forum-toolbar">
                    <input
                        type="text"
                        className="forum-search"
                        placeholder="Search threads..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="forum-filters">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`chip ${category === cat ? 'active' : ''}`}
                                onClick={() => setCategory(cat)}
                            >{cat}</button>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="forum-stats">
                    <span>📝 {threads.length} threads</span>
                    <span>👥 Community driven</span>
                </div>

                {/* Thread List */}
                <section className="threads-list">
                    {loading ? (
                        <div className="loading">Loading threads...</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">💬</span>
                            <h3>No threads found</h3>
                            <p>{search ? 'Try a different search term.' : 'Be the first to start a discussion!'}</p>
                        </div>
                    ) : filtered.map(thread => (
                        <article key={thread.id} className="thread-item card">
                            {/* Vote Column */}
                            <div className="thread-votes">
                                <button className="vote-btn up" onClick={() => handleVoteThread(thread.id, 'upvote')} title="Upvote">▲</button>
                                <span className="vote-count">{(thread.upvotes || 0) - (thread.downvotes || 0)}</span>
                                <button className="vote-btn down" onClick={() => handleVoteThread(thread.id, 'downvote')} title="Downvote">▼</button>
                            </div>
                            {/* Content */}
                            <div className="thread-main" onClick={() => openThread(thread.id)}>
                                <div className="thread-top">
                                    <span className="thread-cat">{thread.category}</span>
                                    <h3>{thread.title}</h3>
                                </div>
                                <div className="thread-meta">
                                    <span className="meta-author">👤 {getAuthor(thread)}</span>
                                    <span>💬 {thread.reply_count || 0} replies</span>
                                    <span>🕐 {timeAgo(thread.created_at)}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                {/* New Thread Modal */}
                {showNewThread && (
                    <div className="modal-overlay" onClick={() => setShowNewThread(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Start a New Thread</h2>
                                <button className="modal-close" onClick={() => setShowNewThread(false)}>×</button>
                            </div>
                            <form className="modal-body" onSubmit={handleCreateThread}>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={newThread.title}
                                        onChange={e => setNewThread(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                        placeholder="What's your question or topic?"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={newThread.category}
                                        onChange={e => setNewThread(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        {categories.slice(1).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Content</label>
                                    <textarea
                                        rows="6"
                                        value={newThread.content}
                                        onChange={e => setNewThread(prev => ({ ...prev, content: e.target.value }))}
                                        required
                                        placeholder="Share details, specs, or context..."
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Post Thread</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Thread Detail Modal */}
                {activeThread && (
                    <div className="modal-overlay" onClick={() => setActiveThread(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{activeThread.title}</h2>
                                <button className="modal-close" onClick={() => setActiveThread(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="thread-detail">
                                    <div className="thread-meta">
                                        <span className="thread-cat">{activeThread.category}</span>
                                        <span>👤 {getAuthor(activeThread)}</span>
                                        <span>🕐 {timeAgo(activeThread.created_at)}</span>
                                    </div>
                                    <div className="thread-detail-votes">
                                        <button className="vote-btn up" onClick={() => handleVoteThread(activeThread.id, 'upvote')}>▲</button>
                                        <span className="vote-count">{(activeThread.upvotes || 0) - (activeThread.downvotes || 0)}</span>
                                        <button className="vote-btn down" onClick={() => handleVoteThread(activeThread.id, 'downvote')}>▼</button>
                                    </div>
                                    <p className="thread-content">{activeThread.content}</p>
                                </div>

                                <div className="replies-section">
                                    <h4>💬 {activeThread.replies?.length || 0} Replies</h4>
                                    {activeThread.replies?.map(reply => (
                                        <div key={reply.id} className="reply-item">
                                            <div className="reply-votes">
                                                <button className="vote-btn up" onClick={() => handleVoteReply(reply.id, 'upvote')}>▲</button>
                                                <span className="vote-count">{(reply.upvotes || 0) - (reply.downvotes || 0)}</span>
                                                <button className="vote-btn down" onClick={() => handleVoteReply(reply.id, 'downvote')}>▼</button>
                                            </div>
                                            <div className="reply-content">
                                                <div className="reply-meta">
                                                    <strong>👤 {reply.author?.username || reply.author_username}</strong>
                                                    <span>{timeAgo(reply.created_at)}</span>
                                                </div>
                                                <p>{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {user ? (
                                    <form className="reply-form" onSubmit={handleReply}>
                                        <textarea
                                            rows="3"
                                            value={newReply}
                                            onChange={e => setNewReply(e.target.value)}
                                            required
                                            placeholder="Write a helpful reply..."
                                        />
                                        <button type="submit" className="btn btn-primary">Post Reply</button>
                                    </form>
                                ) : (
                                    <div className="login-prompt">
                                        <Link to="/login" className="btn btn-primary">Login to Reply</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
