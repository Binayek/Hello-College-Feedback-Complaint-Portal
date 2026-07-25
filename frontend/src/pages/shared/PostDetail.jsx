import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { TimeAgo, Spinner, AnonBadge, RoleBadge, SectionLabel } from '../../components/shared/UI';
import ModerationError, { parseModerationError } from '../../components/shared/ModerationError';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const backPath = `/${user?.role}/community`;

  const [post, setPost]         = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ content: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [moderationErr, setModerationErr] = useState(null);

  const fetchPost = useCallback(() => {
    api.get(`/community/${id}`)
      .then(res => {
        setPost(res.data.post);
        setComments(res.data.comments);
      })
      .catch(() => toast.error('Failed to load post'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleComment = async (e) => {
    e.preventDefault();
    setModerationErr(null);
    setSubmitting(true);
    try {
      await api.post(`/community/${id}/comments`, form);
      setForm({ content: '', is_anonymous: false });
      fetchPost();
      toast.success('Comment added!');
    } catch (err) {
      const mod = parseModerationError(err);
      if (mod) {
        setModerationErr(mod);
      } else {
        toast.error('Failed to add comment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePost = async () => {
    if (!window.confirm('Remove this post?')) return;
    try {
      await api.delete(`/community/${id}`);
      toast.success('Post removed');
      navigate(backPath);
    } catch { toast.error('Failed to remove post'); }
  };

  if (loading) return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(backPath)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Community Board
      </button>
      <Spinner />
    </div>
  );

  if (!post) return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(backPath)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Community Board
      </button>
      <p style={{ color: 'var(--text-muted)' }}>Post not found.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Back button */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => navigate(backPath)}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={14} /> Community Board
      </button>

      {/* ── Post card ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">

          {/* Meta top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {post.category && (
                <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                  {post.category}
                </span>
              )}
              <AnonBadge isAnonymous={post.is_anonymous} />
            </div>
            {user.role === 'admin' && (
              <button className="btn btn-danger btn-sm" onClick={handleRemovePost}>
                <Trash2 size={13} /> Remove post
              </button>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
            {post.title}
          </h1>

          {/* Body */}
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '1.25rem' }}>
            {post.content}
          </p>

          {/* Author + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
            {post.author_name ? (
              <>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{post.author_name}</span>
                {post.author_role && <RoleBadge role={post.author_role} />}
                {post.author_faculty && <span>· {post.author_faculty}</span>}
              </>
            ) : (
              <span>🎭 Anonymous</span>
            )}
            <span>·</span>
            <TimeAgo date={post.created_at} />
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MessageSquare size={13} /> {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Comments ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>
          <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
          Comments ({comments.length})
        </SectionLabel>

        {comments.length === 0 ? (
          <div className="card">
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No comments yet — be the first to reply!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {comments.map(c => (
              <div key={c.id} className="card">
                <div className="card-body" style={{ padding: '0.875rem 1.125rem' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.625rem', whiteSpace: 'pre-wrap' }}>
                    {c.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {c.author_name ? (
                      <>
                        <span style={{ fontWeight: 500, color: 'var(--text)' }}>{c.author_name}</span>
                        {c.author_role && <RoleBadge role={c.author_role} />}
                      </>
                    ) : (
                      <span>🎭 Anonymous</span>
                    )}
                    <span>·</span>
                    <TimeAgo date={c.created_at} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add comment ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Add a comment</span>
        </div>
        <div className="card-body">
          {/* Moderation error shown above the textarea */}
          <ModerationError error={moderationErr} />

          <form onSubmit={handleComment}>
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={form.content}
                onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setModerationErr(null); }}
                placeholder="Write a thoughtful reply…"
                style={{ minHeight: 100 }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <label className="checkbox-row" style={{ flex: '0 0 auto' }}>
                <input
                  type="checkbox"
                  checked={form.is_anonymous}
                  onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
                />
                <label>Comment anonymously</label>
              </label>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
