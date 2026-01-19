import { useState, useEffect } from 'react'
import { getThreads, getThread, createThread, createReply } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import './Forum.css'

const categories = ['All', 'Build Help', 'Troubleshooting', 'Discussion', 'Showcase']

export default function Forum() {
    const { user } = useAuth()
    const [threads, setThreads] = useState([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('All')
    const [activeThread, setActiveThread] = useState(null)
    const [showNewThread, setShowNewThread] = useState(false)
    const [newThread, setNewThread] = useState({ title: '', content: '', category: 'Discussion' })
    const [newReply, setNewReply] = useState('')

    useEffect(() => {
        loadThreads()
    }, [category])

    const loadThreads = async () => {
        setLoading(true)
        try {
            const cat = category === 'All' ? '' : category
            const data = await getThreads({ category: cat })
            setThreads(data)
        } catch {
            setThreads([])
        } finally {
            setLoading(false)
        }
    }

    const openThread = async (id) => {
        try {
            const data = await getThread(id)
            setActiveThread(data)
        } catch {
            alert('Failed to load thread')
        }
    }

    const handleCreateThread = async (e) => {
        e.preventDefault()
        if (!user) {
            alert('Please login to create a thread')
            return
        }
        try {
            await createThread(newThread)
            setNewThread({ title: '', content: '', category: 'Discussion' })
            setShowNewThread(false)
            loadThreads()
        } catch (err) {
            alert('Failed: ' + err.message)
        }
    }

    const handleReply = async (e) => {
        e.preventDefault()
        if (!user) {
            alert('Please login to reply')
            return
        }
        try {
            await createReply(activeThread.id, newReply)
            setNewReply('')
            openThread(activeThread.id)
        } catch (err) {
            alert('Failed: ' + err.message)
        }
    }

    return (
        <main className="page-content">
            <div className="container">
                <header className="forum-header">
                    <div>
                        <h1>Community Forum</h1>
                        <p>Ask questions, share builds, and help others.</p>
                    </div>
                    {user && (
                        <button className="btn btn-primary" onClick={() => setShowNewThread(true)}>
                            + New Thread
                        </button>
                    )}
                </header>

                <div className="forum-filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`chip ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >{cat}</button>
                    ))}
                </div>

                <section className="threads-list">
                    {loading ? (
                        <div className="loading">Loading threads...</div>
                    ) : threads.length === 0 ? (
                        <div className="empty-state">
                            <h3>No threads yet</h3>
                            <p>Be the first to start a discussion!</p>
                            {!user && <Link to="/login" className="btn btn-primary">Login to Post</Link>}
                        </div>
                    ) : threads.map(thread => (
                        <article key={thread.id} className="thread-item card" onClick={() => openThread(thread.id)}>
                            <span className="thread-cat">{thread.category}</span>
                            <h3>{thread.title}</h3>
                            <div className="thread-meta">
                                <span>by {thread.author_username}</span>
                                <span>{thread.reply_count} replies</span>
                                <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                            </div>
                        </article>
                    ))}
                </section>

                {/* New Thread Modal */}
                {showNewThread && (
                    <div className="modal-overlay" onClick={() => setShowNewThread(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>New Thread</h2>
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
                                        placeholder="What's your question?"
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
                                        rows="5"
                                        value={newThread.content}
                                        onChange={e => setNewThread(prev => ({ ...prev, content: e.target.value }))}
                                        required
                                        placeholder="Describe your question or topic..."
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
                                        <span>by {activeThread.author_username}</span>
                                        <span>{new Date(activeThread.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="thread-content">{activeThread.content}</p>
                                </div>

                                <div className="replies-section">
                                    <h4>{activeThread.replies?.length || 0} Replies</h4>
                                    {activeThread.replies?.map(reply => (
                                        <div key={reply.id} className="reply-item">
                                            <div className="reply-meta">
                                                <strong>{reply.author_username}</strong>
                                                <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p>{reply.content}</p>
                                        </div>
                                    ))}
                                </div>

                                {user && (
                                    <form className="reply-form" onSubmit={handleReply}>
                                        <textarea
                                            rows="3"
                                            value={newReply}
                                            onChange={e => setNewReply(e.target.value)}
                                            required
                                            placeholder="Write a reply..."
                                        />
                                        <button type="submit" className="btn btn-primary">Reply</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
