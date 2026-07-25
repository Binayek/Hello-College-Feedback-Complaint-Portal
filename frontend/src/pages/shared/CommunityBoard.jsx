import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { TimeAgo, EmptyState, Spinner } from '../../components/shared/UI';
import ModerationError, { parseModerationError } from '../../components/shared/ModerationError';
import { MessageSquare, Plus, X, Trash2, Search } from 'lucide-react';

//types of complaints
const CATEGORIES = ['Academic', 'Facilities', 'Administration', 'Faculty', 'Events', 'Other'];

// Main component for the community board page
export default function CommunityBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const communityBase = `/${user?.role}/community`;

  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [form, setForm]             = useState({ title: '', content: '', category: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [moderationErr, setModerationErr] = useState(null);

  // Fetches posts from the API based on search and filter criteria
  const fetchPosts = useCallback(() => {
    const params = {};
    if (search)    params.search = search;
    if (filterCat) params.category = filterCat;
    api.get('/community', { params })
      .then(res => setPosts(res.data.posts))
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  }, [search, filterCat]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

// Handles submission of a new post
  const handleCreate = async (e) => {
    e.preventDefault();
    setModerationErr(null);
    setSubmitting(true);
    try {
      await api.post('/community', form);
      toast.success('Post published!');
      setForm({ title: '', content: '', category: '', is_anonymous: false });
      setShowCreate(false);
      fetchPosts();
    } catch (err) {
      const mod = parseModerationError(err);
      if (mod) {
        setModerationErr(mod);              // show inline — don't close the form
      } else {
        toast.error('Failed to create post');
      }
    } finally {
      setSubmitting(false);
    }
  };

// Handles removal of a post by an admin
  const handleRemove = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Remove this post?')) return;
    try { await api.delete(`/community/${id}`); toast.success('Post removed'); fetchPosts(); }
    catch { toast.error('Failed to remove post'); }
  };

  
  return (
    <div>
        {/* Page header with title, subtitle, and new post button */ }
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Board</h1>
          <p className="page-subtitle">Open discussion for the college community</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setShowCreate(v => !v); setModerationErr(null); }}>
            <Plus size={15} /> New Post
          </button>
        </div>
      </div>

      {/*  create a new post form  */}
      {showCreate && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Create a Post</span>
            <button className="modal-close" onClick={() => { setShowCreate(false); setModerationErr(null); }}>
              <X size={16} />
            </button>
          </div>
          <div className="card-body">
            {/* Moderation error — shown above the form fields */}
            <ModerationError error={moderationErr} />

            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setModerationErr(null); }}
                    placeholder="What's this about?"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">No category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-textarea"
                  value={form.content}
                  onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setModerationErr(null); }}
                  placeholder="Share your thoughts, ask a question, or start a discussion…"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Checkbox for posting anonymously and submit button */ }
                <label className="checkbox-row" style={{ flex: '0 0 auto' }}>
                  <input type="checkbox" checked={form.is_anonymous}
                    onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} />
                  <label>Post anonymously</label>
                </label>
                {/* Submit button for publishing the post */ }
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing…' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: '2rem' }}
            placeholder="Search posts…" value={search}
            onChange={e => setSearch(e.target.value)} />
        {/* Category filter dropdown */ }
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={filterCat}
          onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/*  Post list */}
      <div className="card">
        {loading ? <Spinner /> : posts.length === 0 ? (
          <EmptyState icon="📋" title="No posts yet"
            description="Start a discussion or ask a question!"
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create First Post</button>}
          />
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className="list-row"
              onClick={() => navigate(`${communityBase}/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="list-row-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-row-title">{post.title}</div>
                  <div className="list-row-meta">
                    <span>{post.author_name || '🎭 Anonymous'}</span>
                    {post.author_faculty && <span>{post.author_faculty}</span>}
                    <span><TimeAgo date={post.created_at} /></span>
                    <span>
                      <MessageSquare size={11} style={{ display: 'inline', marginRight: 3 }} />
                      {post.comment_count}
                    </span>
                  </div>
                </div>
                <div className="badge-row">
                  {post.category && (
                    <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                      {post.category}
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={e => handleRemove(e, post.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <p className="list-row-preview">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}