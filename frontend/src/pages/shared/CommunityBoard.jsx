import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { TimeAgo, EmptyState, Spinner, SectionLabel, AnonBadge, RoleBadge } from '../../components/shared/UI';
import { MessageSquare, Plus, X, Trash2, Search } from 'lucide-react';


//types of complaints
const CATEGORIES = ['Academic', 'Facilities', 'Administration', 'Faculty', 'Events', 'Other'];

// Modal for post details and comments
function PostDetailModal({ post, onClose, isAdmin }) {
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [loadingC, setLoadingC]   = useState(true);
  const [form, setForm]           = useState({ content: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  
  // Fetches comments for the post from the API
  const fetchComments = useCallback(() => {
    api.get(`/community/${post.id}`)
      .then(res => setComments(res.data.comments))
      .finally(() => setLoadingC(false));
  }, [post.id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Handles submission of a new comment
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/community/${post.id}/comments`, form);
      setForm({ content: '', is_anonymous: false });
      fetchComments();
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmitting(false); }
  };

  //renders the modal with post details, comments, and a form to add new comments
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Modal header with post title, category, and anonymous badge */ }
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{post.title}</h2>
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: 4, flexWrap: 'wrap' }}>
              {post.category && <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{post.category}</span>}
              <AnonBadge isAnonymous={post.is_anonymous} />
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{post.content}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {post.author_name
              ? <>{post.author_name} {post.author_role && <RoleBadge role={post.author_role} />} {post.author_faculty && `· ${post.author_faculty}`}</>
              : '🎭 Anonymous'
            } · <TimeAgo date={post.created_at} />
          </p>

          <hr className="section-divider" />
            {/* Section for displaying comments and adding new comments */ }
          <SectionLabel>
            <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
            Comments ({comments.length})
          </SectionLabel>

          {loadingC ? <Spinner /> : comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.855rem' }}>No comments yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
              {comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: 6 }}>
                  <p style={{ fontSize: '0.855rem' }}>{c.content}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {c.author_name || '🎭 Anonymous'}
                    {c.author_role && <> · <RoleBadge role={c.author_role} /></>}
                    {' · '}<TimeAgo date={c.created_at} />
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* Form for adding a new comment */ }
          <form onSubmit={submit} style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="form-group">
              <textarea className="form-textarea" value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write a comment…" style={{ minHeight: 72 }} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <label className="checkbox-row" style={{ flex: 1 }}>
                <input type="checkbox" checked={form.is_anonymous}
                  onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} />
                <label>Comment anonymously</label>
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? '…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main component for the community board page
export default function CommunityBoard() {
  const { user } = useAuth();
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm]           = useState({ title: '', content: '', category: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      await api.post('/community', form);
      toast.success('Post published!');
      setForm({ title: '', content: '', category: '', is_anonymous: false });
      setShowCreate(false);
      fetchPosts();
    } catch { toast.error('Failed to create post'); }
    finally { setSubmitting(false); }
  };

  // Handles removal of a post by an admin
  const handleRemove = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Remove this post?')) return;
    try { await api.delete(`/community/${id}`); toast.success('Post removed'); fetchPosts(); }
    catch { toast.error('Failed to remove'); }
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
          <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
            <Plus size={15} /> New Post
          </button>
        </div>
      </div>

      {/*create a new post form*/}
      {showCreate && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Create a Post</span>
            <button className="modal-close" onClick={() => setShowCreate(false)}><X size={16} /></button>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="What's this about?" required />
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
                <textarea className="form-textarea" value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Share your thoughts, ask a question, or start a discussion…" required />
              </div>
              {/* Checkbox for posting anonymously and submit button */ }
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
        </div>
        {/* Category filter dropdown */ }
        <select className="form-select" style={{ width: 'auto' }} value={filterCat}
          onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Posts list */}
      <div className="card">
        {loading ? <Spinner /> : posts.length === 0 ? (
          <EmptyState icon="📋" title="No posts yet"
            description="Start a discussion or ask a question!"
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create First Post</button>}
          />
        ) : (
          posts.map(post => (
            <div key={post.id} className="list-row" onClick={() => setSelected(post)}>
              <div className="list-row-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-row-title">{post.title}</div>
                  <div className="list-row-meta">
                    <span>{post.author_name || '🎭 Anonymous'}</span>
                    {post.author_faculty && <span>{post.author_faculty}</span>}
                    <span><TimeAgo date={post.created_at} /></span>
                    <span><MessageSquare size={11} style={{ display: 'inline' }} /> {post.comment_count}</span>
                  </div>
                </div>
                <div className="badge-row">
                  {post.category && <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{post.category}</span>}
                  {user.role === 'admin' && (
                    <button className="btn btn-danger btn-sm" onClick={e => handleRemove(e, post.id)}>
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

        {/* Post detail modal for viewing and commenting on a selected post */ }
      {selected && (
        <PostDetailModal
          post={selected}
          isAdmin={user.role === 'admin'}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
