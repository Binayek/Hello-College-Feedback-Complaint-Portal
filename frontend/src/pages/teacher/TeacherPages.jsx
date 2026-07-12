import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  StatusBadge, PriorityBadge, AnonBadge, TimeAgo,
  EmptyState, Spinner, SectionLabel, ResponseBox
} from '../../components/shared/UI';
import { X } from 'lucide-react';

//component for modal to view and respond to a complaint
//pop up modal that shows the complaint details and allows the teacher to respond to it
function ComplaintModal({ complaintId, onClose, onUpdate }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ content: '', new_status: '' });
  const [submitting, setSubmitting] = useState(false);

  //function to fetch complaint details from the API when the modal is opened
  useEffect(() => {
    api.get(`/complaints/${complaintId}`)
      .then(res => { setData(res.data); setForm(f => ({ ...f, new_status: res.data.complaint.status === 'in_progress' ? 'resolved' : 'in_progress' })); })
      .finally(() => setLoading(false));
  }, [complaintId]);

  //function to handle the form submission when the teacher responds to the complaint
  const handleRespond = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/complaints/${complaintId}/respond`, form);
      toast.success('Response submitted!');
      onUpdate();
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to respond'); }
    finally { setSubmitting(false); }
  };

  //get the complaint data from the API response
  const c = data?.complaint;

  //render the modal with complaint details, previous responses, and a form to respond
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Modal header with title and close button */}
        <div className="modal-header">
          <span className="card-title">{c?.title || 'Complaint'}</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {loading || !data ? <Spinner /> : (
            <>
            {/* Display badges for status, priority, anonymity, and category of the complaint */}
              <div className="badge-row" style={{ marginBottom: '1rem' }}>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                <AnonBadge isAnonymous={c.is_anonymous} />
                {c.category && <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{c.category}</span>}
              </div>
            {/* Display the student information and assignment remarks if available */}
              <SectionLabel>From</SectionLabel>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {c.is_anonymous && !c.identity_revealed
                  ? '🎭 Anonymous Student'
                  : <>{c.student_name} {c.student_faculty && `· ${c.student_faculty}`}</>
                }
              </p>

              {c.assignment_remarks && (
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  📌 Assignment note: {c.assignment_remarks}
                </div>
              )}

              {/* Display the complaint description and any previous responses */}
              <SectionLabel>Complaint</SectionLabel>
              <ResponseBox content={c.description} time={c.created_at} color="var(--bg)" borderColor="var(--border)" />

              {data.responses.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <SectionLabel>Previous Responses</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {data.responses.map(r => (
                      <ResponseBox key={r.id} content={r.content}
                        author={`${r.responder_name} (${r.responder_role})`}
                        time={r.created_at} color="#EFF6FF" borderColor="var(--primary)" />
                    ))}
                  </div>
                </div>
              )}

              {/* Display the response form if the complaint is not resolved or closed */}
              {!['resolved', 'closed'].includes(c.status) && (
                <form onSubmit={handleRespond} style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <SectionLabel>Add Response</SectionLabel>
                  <div className="form-group">
                    <textarea className="form-textarea" value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Write your response to the student…" style={{ minHeight: 100 }} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Update Status</label>
                    <select className="form-select" value={form.new_status}
                      onChange={e => setForm(f => ({ ...f, new_status: e.target.value }))}>
                      <option value="">— No change —</option>
                      <option value="in_progress">Mark as In Progress</option>
                      <option value="resolved">Mark as Resolved</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Response'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Teacher dashboard page that shows summary stats and recent complaints assigned to the teacher
export function TeacherDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);

  //fetch the complaints assigned to the teacher when the component mounts
  useEffect(() => {
    api.get('/complaints/assigned')
      .then(res => setComplaints(res.data.complaints))
      .finally(() => setLoading(false));
  }, []);

  //categorize complaints by status for display in the dashboard stats
  const open     = complaints.filter(c => c.status === 'assigned').length;
  const inProg   = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

  //render the dashboard with welcome message, stats, and recent complaints
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user.name} 👋</h1>
          <p className="page-subtitle">{user.faculty_name || 'Teacher'} · Hello College</p>
        </div>
      </div>

      {/* Display summary statistics for complaints assigned to the teacher */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{complaints.length}</div><div className="stat-label">Total Assigned</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: open > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{open}</div><div className="stat-label">Needs Response</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--warning)' }}>{inProg}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{resolved}</div><div className="stat-label">Resolved</div></div>
      </div>

      {open > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          ⚠️ You have <strong>{open}</strong> complaint{open > 1 ? 's' : ''} waiting for your response.
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Assigned Complaints</span></div>
        {loading ? <Spinner /> : complaints.slice(0, 5).length === 0 ? (
          <EmptyState icon="✅" title="No complaints assigned" description="You'll be notified when a complaint is assigned to you." />
        ) : complaints.slice(0, 5).map(c => (
          <div key={c.id} className="list-row" style={{ cursor: 'default' }}>
            <div className="list-row-head">
              <div><div className="list-row-title">{c.title}</div>
                <div className="list-row-meta"><span>{c.category || 'General'}</span><span><TimeAgo date={c.created_at} /></span></div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Teacher complaints page that shows all complaints assigned to the teacher with filtering and modal for responding
export function TeacherComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab]   = useState('pending');

  //function to fetch the complaints assigned to the teacher from the API
  const fetchComplaints = () => {
    api.get('/complaints/assigned')
      .then(res => setComplaints(res.data.complaints))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  //types of complaints based on their status
  const tabs = [
    { key: 'pending',  label: 'Needs Response' },
    { key: 'active',   label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all',      label: 'All' },
  ];

  //filter the complaints based on the active tab selected by the teacher
  const filtered = complaints.filter(c => {
    if (activeTab === 'pending')  return c.status === 'assigned';
    if (activeTab === 'active')   return c.status === 'in_progress';
    if (activeTab === 'resolved') return ['resolved', 'closed'].includes(c.status);
    return true;
  });

  //render the complaints page with tabs for filtering and a modal for responding to complaints
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Complaints</h1>
          <p className="page-subtitle">Student complaints assigned to you by administration</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(({ key, label }) => {
          const count = key === 'all' ? complaints.length
            : key === 'pending' ? complaints.filter(c => c.status === 'assigned').length
            : key === 'active'  ? complaints.filter(c => c.status === 'in_progress').length
            : complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
          return (
            <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}<span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="card">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="✅" title="All clear!" description="No complaints in this category." />
        ) : (
          filtered.map(c => (
            <div key={c.id} className="list-row" onClick={() => setSelectedId(c.id)}>
              <div className="list-row-head">
                <div>
                  <div className="list-row-title">{c.title}</div>
                  <div className="list-row-meta">
                    <span>{c.is_anonymous ? '🎭 Anonymous' : c.student_name}</span>
                    {c.student_faculty && <span>{c.student_faculty}</span>}
                    <span><TimeAgo date={c.created_at} /></span>
                  </div>
                </div>
                <div className="badge-row">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
              </div>
              <p className="list-row-preview">{c.description}</p>
            </div>
          ))
        )}
      </div>

      {/* Render the complaint modal if a complaint is selected */}
      {selectedId && (
        <ComplaintModal
          complaintId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={fetchComplaints}
        />
      )}
    </div>
  );
}
