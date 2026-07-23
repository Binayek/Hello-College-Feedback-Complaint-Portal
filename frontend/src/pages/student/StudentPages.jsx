import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ModerationError, { parseModerationError } from '../../components/shared/ModerationError';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  StatusBadge, PriorityBadge, AnonBadge, TimeAgo,
  EmptyState, Spinner, SectionLabel, ResponseBox
} from '../../components/shared/UI';
import { Plus, X, Eye } from 'lucide-react';

const CATEGORIES = ['Academic', 'Faculty Conduct', 'Facilities', 'Administration', 'Harassment', 'Financial', 'Other'];

//complaint description modal(pop up window)
function ComplaintDetailModal({ complaintId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  //fetches selected complaint
  useEffect(() => {
    api.get(`/complaints/${complaintId}`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [complaintId]);

  //renders modal
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {/*complaint title as modal's title*/}
          <span className="card-title">{data?.complaint?.title || 'Complaint Details'}</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {loading || !data ? <Spinner /> : (
            <>
              {/*Status, Priority, Annonymity badge of the complaint*/}
              <div className="badge-row" style={{ marginBottom: '1rem' }}>
                <StatusBadge status={data.complaint.status} />
                <PriorityBadge priority={data.complaint.priority} />
                <AnonBadge isAnonymous={data.complaint.is_anonymous} />
                {data.complaint.category && (
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{data.complaint.category}</span>
                )}
              </div>

              <SectionLabel>Your Complaint</SectionLabel>
              {/*complaint description*/}
              <ResponseBox
                content={data.complaint.description}
                time={data.complaint.created_at}
                color="var(--bg)" borderColor="var(--border)"
              />

                {/*assigned teacher or faculty*/}
              {data.complaint.assigned_to_name && (
                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                  📋 Assigned to: <strong>{data.complaint.assigned_to_name}</strong>
                  {data.complaint.assigned_faculty_name && ` (${data.complaint.assigned_faculty_name})`}
                </div>
              )}

              {/*response from teacher/faculty*/}
              {data.responses.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <SectionLabel>Responses</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.responses.map(r => (
                      <ResponseBox
                        key={r.id}
                        content={r.content}
                        author={`${r.responder_name} (${r.responder_role})`}
                        time={r.created_at}
                        color="#EFF6FF"
                        borderColor="var(--primary)"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/*identity revealed notice*/}
              {data.complaint.identity_revealed && (
                <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                  🔓 Your identity has been revealed by administration for this case.
                </div>
              )}

              {data.complaint.resolved_at && (
                <p style={{ fontSize: '0.855rem', color: 'var(--success)', marginTop: '0.75rem' }}>
                  ✅ Resolved <TimeAgo date={data.complaint.resolved_at} />
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Student Dashboard 
export function StudentDashboard() {
  //fetches user data and define state variables.
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);

  //fetches complaints data from the API
  useEffect(() => {
    api.get('/complaints/mine')
      .then(res => setComplaints(res.data.complaints))
      .finally(() => setLoading(false));
  }, []);

  //filter complaints based on their status
  const open     = complaints.filter(c => c.status === 'open').length;
  const inProg   = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

  //renders the dashboard with statistics and recent complaints
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user.name} 👋</h1>
          <p className="page-subtitle">{user.faculty_name || 'Student'} · Hello College Portal</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{complaints.length}</div><div className="stat-label">Total Complaints</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: open > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{open}</div><div className="stat-label">Open</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--primary)' }}>{inProg}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{resolved}</div><div className="stat-label">Resolved</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Complaints</span>
          <Link to="/student/complaints" className="btn btn-secondary btn-sm">View all</Link>
        </div>
        {loading ? <Spinner /> : complaints.slice(0, 5).length === 0 ? (
          <EmptyState icon="✍️" title="No complaints yet"
            description="File a complaint to get started."
            action={<Link to="/student/complaints" className="btn btn-primary btn-sm">File a Complaint</Link>}
          />
        ) : (
          complaints.slice(0, 5).map(c => (
            <div key={c.id} className="list-row" style={{ cursor: 'default' }}>
              <div className="list-row-head">
                <div><div className="list-row-title">{c.title}</div>
                  <div className="list-row-meta"><span>{c.category || 'General'}</span><span><TimeAgo date={c.created_at} /></span></div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: '1.25rem' }}>
        💡 <strong>Privacy:</strong> You can submit complaints anonymously. Your identity is only revealed by administration in serious legal cases, and you will be notified if this happens.
      </div>
    </div>
  );
}

// My Complaints page for students to view and submit complaints
export function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm]             = useState({ title: '', description: '', category: '', priority: 'medium', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [moderationErr, setModerationErr] = useState(null);
  const [activeTab, setActiveTab]   = useState('all');

  //fetches complaints data from the API
  const fetchComplaints = () => {
    api.get('/complaints/mine')
      .then(res => setComplaints(res.data.complaints))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  //handles form submission for new complaints
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModerationErr(null);
    setSubmitting(true);
    try {
      await api.post('/complaints', form);
      toast.success('Complaint submitted!');
      setForm({ title: '', description: '', category: '', priority: 'medium', is_anonymous: false });
      setShowForm(false);
      fetchComplaints();
    } catch (err) {
      const mod = parseModerationError(err);
      if (mod) {
        setModerationErr(mod);             // keep form open, show error inline
      } else {
        toast.error(err.response?.data?.error || 'Failed to submit');
      }
    } finally {
      setSubmitting(false);
    }
  };

  //defines tabs for filtering complaints
  const tabs = [
    { key: 'all',      label: 'All' },
    { key: 'open',     label: 'Open' },
    { key: 'active',   label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  //counts the number of complaints in each tab
  const tabCount = (key) => {
    if (key === 'all')      return complaints.length;
    if (key === 'open')     return complaints.filter(c => c.status === 'open').length;
    if (key === 'active')   return complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length;
    return complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
  };

  //filters complaints based on the active tab selection
  const filtered = complaints.filter(c => {
    if (activeTab === 'open')     return c.status === 'open';
    if (activeTab === 'active')   return ['assigned', 'in_progress'].includes(c.status);
    if (activeTab === 'resolved') return ['resolved', 'closed'].includes(c.status);
    return true;
  });

  //renders the My Complaints page with complaint submission form and list of complaints
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Submit and track your formal complaints to administration</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setShowForm(v => !v); setModerationErr(null); }}>
            <Plus size={15} /> File Complaint
          </button>
        </div>
      </div>

      {/*renders the complaint submission form if showForm is true*/}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">New Formal Complaint</span>
            <button className="modal-close" onClick={() => { setShowForm(false); setModerationErr(null); }}>
              <X size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
              ⚠️ This complaint goes directly to college administration. Choose anonymous if you prefer privacy — your identity is only revealed in serious legal cases.
            </div>

            {/* Moderation error shown above fields */}
            <ModerationError error={moderationErr} />
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title}
                  onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setModerationErr(null); }}
                  placeholder="Brief summary of your complaint" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setModerationErr(null); }}
                  placeholder="Describe in detail: what happened, when, who was involved, what outcome you expect…"
                  style={{ minHeight: 130 }} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label className="checkbox-row" style={{ flex: '0 0 auto' }}>
                  <input type="checkbox" checked={form.is_anonymous}
                    onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} />
                  <label>Submit anonymously</label>
                </label>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/*renders tabs for filtering complaints by status*/} 
      <div className="tabs">
        {tabs.map(({ key, label }) => {
          const count = key === 'all' ? complaints.length
            : key === 'open' ? complaints.filter(c => c.status === 'open').length
            : key === 'active' ? complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length
            : complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
          return (
            <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}<span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

        {/*renders the list of complaints based on the selected tab and loading state*/}
      <div className="card">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="📭" title="No complaints here" description="Nothing in this category." />
        ) : (
          filtered.map(c => (
            <div key={c.id} className="list-row" onClick={() => setSelectedId(c.id)}>
              <div className="list-row-head">
                <div>
                  <div className="list-row-title">{c.title}</div>
                  <div className="list-row-meta">
                    {c.category && <span>{c.category}</span>}
                    <span><TimeAgo date={c.created_at} /></span>
                    {c.assigned_to_name && <span>→ {c.assigned_to_name}</span>}
                    {c.latest_response && <span style={{ color: 'var(--success)' }}>💬 New response</span>}
                  </div>
                </div>
                <div className="badge-row">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <AnonBadge isAnonymous={c.is_anonymous} />
                </div>
              </div>
              <p className="list-row-preview">{c.description}</p>
            </div>
          ))
        )}
      </div>
        
        {/*renders the complaint detail modal if a complaint is selected*/}
      {selectedId && (
        <ComplaintDetailModal complaintId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
