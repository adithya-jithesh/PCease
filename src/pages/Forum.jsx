import React, { useEffect, useMemo, useState } from 'react'
import '../styles/forum.css'
import { isLoggedIn, getSession, getToken } from '../lib/auth.js'
import { getThreads, createThread, deleteThread, getThread, addReply } from '../shared/api.js'

export default function Forum() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ title: '', category: 'General', content: '' })
  const [expanded, setExpanded] = useState({}) // threadId => boolean
  const [replies, setReplies] = useState({}) // threadId => { loading, list }
  const [replyText, setReplyText] = useState({}) // threadId => string

  const load = async (category) => {
    setLoading(true); setError('')
    try{ const list = await getThreads(category); setThreads(list) }
    catch(e){ setError('Failed to load threads') }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load('') },[])

  const filtered = useMemo(() => {
    const list = [...threads].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
    return filter ? list.filter(t=>t.category===filter) : list
  }, [threads, filter])

  const session = getSession()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn()) { window.location.href = '/login?redirect=/forum' ; return }
    if (!form.title.trim() || !form.content.trim()) return
    try{
      await createThread({ title: form.title.trim(), category: form.category, content: form.content.trim(), token: getToken() })
      setForm({ title: '', category: 'General', content: '' })
      await load(filter)
    }catch(err){ alert(err.message || 'Failed to post') }
  }
  const clearAll = () => { /* no-op in Mongo mode; could add admin endpoint */ }
  const del = async (id) => {
    try{ await deleteThread({ id, token: getToken() }); await load(filter) }
    catch(err){ alert(err.message || 'Failed to delete') }
  }

  const toggleReplies = async (id) => {
    setExpanded(s => ({ ...s, [id]: !s[id] }))
    if (!replies[id]){
      setReplies(m => ({ ...m, [id]: { loading: true, list: [] } }))
      try{ const th = await getThread(id); setReplies(m => ({ ...m, [id]: { loading: false, list: th.replies || [] } })) }
      catch{ setReplies(m => ({ ...m, [id]: { loading: false, list: [] } })) }
    }
  }

  const submitReply = async (id) => {
    const text = (replyText[id] || '').trim()
    if (!text) return
    if (!isLoggedIn()) { window.location.href = '/login?redirect=/forum' ; return }
    try{
      const r = await addReply({ id, content: text, token: getToken() })
      setReplyText(m => ({ ...m, [id]: '' }))
      setReplies(m => ({ ...m, [id]: { loading: false, list: [ ...(m[id]?.list||[]), { _id: r.reply?._id || Math.random().toString(36).slice(2), user: getSession()?.username || 'You', content: text, createdAt: new Date().toISOString() } ] } }))
    }catch(err){ alert(err.message || 'Failed to reply') }
  }

  return (
    <main className="container">
      <header className="page-header">
        <h1>Community Forum</h1>
        <p>Discuss builds, share tips, and keep up with PC hardware trends. Please be respectful and helpful.</p>
      </header>

      <section className="forum-layout">
        <div className="forum-column">
          <form className="new-thread-form" onSubmit={onSubmit} aria-label="Create a new thread">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="thread-title">Title</label>
                <input type="text" id="thread-title" placeholder="e.g., Best PSU for 4070 build" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
              </div>
              <div className="form-field">
                <label htmlFor="thread-category">Category</label>
                <select id="thread-category" required value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  <option value="General">General</option>
                  <option value="Builds">Builds</option>
                  <option value="Troubleshooting">Troubleshooting</option>
                  <option value="News">News</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="thread-content">Content</label>
              <textarea id="thread-content" rows="5" placeholder="Share details, what you tried, and your goals..." required value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}></textarea>
            </div>
            <button type="submit" className="cta-button">Post Thread</button>
            {!isLoggedIn() && <p className="login-hint">Login required to post. <a href="/login?redirect=/forum">Login here</a>.</p>}
          </form>
        </div>

        <div className="forum-column">
          <div className="forum-toolbar">
            <div className="forum-filter">
              <label htmlFor="filter-category">Filter:</label>
              <select id="filter-category" value={filter} onChange={e=>{ setFilter(e.target.value); load(e.target.value) }}>
                <option value="">All</option>
                <option value="General">General</option>
                <option value="Builds">Builds</option>
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="News">News</option>
              </select>
            </div>
            <button className="secondary-button" type="button" title="Reload" onClick={()=>load(filter)}>Reload</button>
          </div>
          <div id="threads-list" className="threads-list" aria-live="polite">
            {loading ? (
              <>
                {[...Array(3)].map((_,i)=> (
                  <article key={'skeleton-'+i} className="thread-card">
                    <div className="thread-header">
                      <h3 className="thread-title skeleton" style={{width:'50%'}}>&nbsp;</h3>
                      <div className="thread-meta">
                        <span className="thread-badge skeleton" style={{width:70}}>&nbsp;</span>
                        <span className="thread-date skeleton" style={{width:110}}>&nbsp;</span>
                        <span className="thread-author skeleton" style={{width:90}}>&nbsp;</span>
                      </div>
                    </div>
                    <p className="thread-content skeleton" style={{height:60}}>&nbsp;</p>
                  </article>
                ))}
              </>
            ) : error ? <p className="forum-empty">{error}</p> : filtered.length===0 ? <p className="forum-empty">No threads yet. Be the first to post!</p> : filtered.map(t => (
              <article key={t._id} className="thread-card">
                <div className="thread-header">
                  <h3 className="thread-title">{t.title}</h3>
                  <div className="thread-meta">
                    <span className="thread-badge">{t.category}</span>
                    <span className="thread-date">{new Date(t.createdAt).toLocaleString()}</span>
                    <span className="thread-author">by {t.user || 'Guest'}</span>
                  </div>
                </div>
                <p className="thread-content">{t.content}</p>
                <div className="thread-actions">
                  {session?.username===t.user && <button className="thread-delete" onClick={()=>del(t._id)}>Delete</button>}
                  <button className="secondary-button" onClick={()=>toggleReplies(t._id)}>{expanded[t._id] ? 'Hide Replies' : 'Show Replies'}</button>
                </div>
                {expanded[t._id] && (
                  <div className="thread-replies">
                    {replies[t._id]?.loading ? <p className="forum-empty">Loading replies...</p> : (
                      replies[t._id]?.list?.length ? (
                        <ul className="reply-list">
                          {replies[t._id].list.map(r => (
                            <li key={r._id} className="reply-item">
                              <div className="reply-meta"><strong>{r.user || 'User'}</strong><span>{new Date(r.createdAt).toLocaleString()}</span></div>
                              <p className="reply-content">{r.content}</p>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="forum-empty">No replies yet.</p>
                    )}
                    <div className="reply-form">
                      <input type="text" placeholder="Write a reply..." value={replyText[t._id] || ''} onChange={e=>setReplyText(m => ({ ...m, [t._id]: e.target.value }))} />
                      <button className="cta-button" onClick={()=>submitReply(t._id)}>Reply</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
