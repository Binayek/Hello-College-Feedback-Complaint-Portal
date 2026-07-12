//import essential libraries and components
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  StatusBadge, PriorityBadge, AnonBadge, TimeAgo,
  EmptyState, Spinner, SectionLabel, ResponseBox
} from '../../components/shared/UI';
import { Plus, X, Eye } from 'lucide-react';

//AdminComplaintModal – A popup window where the admin can 
// view a complaint, 
// assign it, 
// update its status, 
// and reveal an anonymous student's identity.
function AdminComplaintModal({ complaintId, teachers, faculties, onClose, onUpdate }) {
  //state variables
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [assignForm, setAssignForm] = useState({ assigned_to_type: 'teacher', assigned_to: '', faculty_id: '', remarks: '' });
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
  const [revealReason, setRevealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  //function to fetch complaint data from the server
  const fetchData = () => {
    api.get(`/complaints/${complaintId}`)
      .then(res => { setData(res.data); setStatusForm(f => ({ ...f, status: res.data.complaint.status })); })
      .finally(() => setLoading(false));
  };
  //fetch data when complaintId changes
  useEffect(() => { fetchData(); }, [complaintId]);

  //function to handle assignment of complaint
  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      //send assignment data to the server
      await api.post(`/complaints/${complaintId}/assign`, assignForm);
      toast.success('Complaint assigned!');
      fetchData(); onUpdate();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to assign'); }
    finally { setSubmitting(false); }
  };

  //function to handle status update of complaint
  const handleStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/complaints/${complaintId}/status`, statusForm);
      toast.success('Status updated!');
      fetchData(); onUpdate();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  //function to handle revelation of student's identity
  const handleReveal = async () => {
    if (!revealReason.trim()) return toast.error('Reason is required');
    if (!window.confirm('This will reveal the student\'s identity and create a permanent audit log. Proceed?')) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/complaints/${complaintId}/reveal`, { reason: revealReason });
      toast.success(`Identity revealed: ${res.data.student.name}`);
      setRevealReason('');
      fetchData(); onUpdate();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reveal'); }
    finally { setSubmitting(false); }
  };

  const c = data?.complaint;
  //rendering the modal
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="card-title">{c?.title || 'Complaint'}</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {loading || !data ? <Spinner /> : (
            <>
              {/* Status row to show complaint status, priority, and anonymity */}
              <div className="badge-row" style={{ marginBottom: '1rem' }}>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                <AnonBadge isAnonymous={c.is_anonymous} />
                {c.category && <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{c.category}</span>}
              </div>

              {/* Student info */}
              <SectionLabel>Submitted By</SectionLabel>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {c.is_anonymous && !c.identity_revealed
                  ? '🎭 Anonymous Student'
                  : <>{c.student_name} · {c.student_email} {c.student_faculty && `· ${c.student_faculty}`}</>
                }
              </p>

              {/* Complaint body */}
              <SectionLabel>Complaint</SectionLabel>
              <ResponseBox content={c.description} time={c.created_at} color="var(--bg)" borderColor="var(--border)" />

              {/* Responses */}
              {data.responses.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <SectionLabel>Responses ({data.responses.length})</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {data.responses.map(r => (
                      <ResponseBox key={r.id} content={r.content}
                        author={`${r.responder_name} (${r.responder_role})`}
                        time={r.created_at} />
                    ))}
                  </div>
                </div>
              )}

              <hr className="section-divider" />

              {/* Assign */}
              <SectionLabel>Assign Complaint</SectionLabel>
              {/* Form to assign the complaint to a teacher or faculty */}
              <form onSubmit={handleAssign} style={{ marginBottom: '1.25rem' }}>
                <div className="form-grid-2" style={{ marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Assign To</label>
                    <select className="form-select" value={assignForm.assigned_to_type}
                      onChange={e => setAssignForm(f => ({ ...f, assigned_to_type: e.target.value, assigned_to: '', faculty_id: '' }))}>
                      <option value="teacher">Teacher</option>
                      <option value="faculty">Faculty/Department</option>
                    </select>
                  </div>
                  {assignForm.assigned_to_type === 'teacher' ? (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Select Teacher</label>
                      <select className="form-select" value={assignForm.assigned_to}
                        onChange={e => setAssignForm(f => ({ ...f, assigned_to: e.target.value }))} required>
                        <option value="">Choose teacher…</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.faculty_name || 'No faculty'})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Select Faculty</label>
                      <select className="form-select" value={assignForm.faculty_id}
                        onChange={e => setAssignForm(f => ({ ...f, faculty_id: e.target.value }))} required>
                        <option value="">Choose faculty…</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Assignment Note (optional)</label>
                  <input className="form-input" value={assignForm.remarks}
                    onChange={e => setAssignForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="Instructions or context for the assignee…" />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>Assign</button>
              </form>

              {/* Status update */}
              <SectionLabel>Update Status</SectionLabel>
              {/* Form to update the status of the complaint */}
              <form onSubmit={handleStatus} style={{ marginBottom: '1.25rem' }}>
                <div className="form-grid-2" style={{ marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select className="form-select" value={statusForm.status}
                      onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                      {['open','assigned','in_progress','resolved','closed'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={submitting} style={{ alignSelf: 'flex-end', height: 38 }}>
                    Update Status
                  </button>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input className="form-input" value={statusForm.remarks}
                    onChange={e => setStatusForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="Optional admin note (visible to student)…" />
                </div>
              </form>

              {/* Identity reveal */}
              {c.is_anonymous && !c.identity_revealed && (
                <>
                  <hr className="section-divider" />
                  <SectionLabel>Reveal Anonymous Identity</SectionLabel>
                  <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>
                    ⚠️ This action is <strong>irreversible</strong> and creates a permanent audit log. Only use in serious or legal cases.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" value={revealReason}
                      onChange={e => setRevealReason(e.target.value)}
                      placeholder="State the legal/serious reason for revealing identity…" />
                    <button className="btn btn-danger btn-sm" onClick={handleReveal} disabled={submitting || !revealReason.trim()}>
                      <Eye size={14} /> Reveal
                    </button>
                  </div>
                </>
              )}

              {c.identity_revealed && (
                <div className="alert alert-warning" style={{ marginTop: '0.75rem' }}>
                  🔓 Identity already revealed by {c.revealed_by_name}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard
export function AdminDashboard() {

  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  //fetch analytics data when component mounts
  useEffect(() => {
    api.get('/complaints/analytics')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  //empty object to map status counts for easy access
  const statusMap = {};
  //populate statusMap with counts from stats
  stats?.byStatus?.forEach(s => { statusMap[s.status] = s.count; });

  //rendering the admin dashboard
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">College Administration</p>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value">{stats?.summary?.total || 0}</div><div className="stat-label">Total Complaints</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.summary?.open || 0}</div><div className="stat-label">Open</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.summary?.resolved || 0}</div><div className="stat-label">Resolved</div></div>
            <div className="stat-card"><div className="stat-value">{stats?.summary?.anonymous_count || 0}</div><div className="stat-label">Anonymous</div></div>
            <div className="stat-card"><div className="stat-value">{stats?.summary?.avg_resolution_hours || '—'}</div><div className="stat-label">Avg. Resolution (hrs)</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* By Category */}
            {stats?.byCategory?.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">By Category</span></div>
                <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
                  {stats.byCategory.map(row => (
                    <div key={row.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      <span>{row.category}</span><strong>{row.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Status */}
            <div className="card">
              <div className="card-header"><span className="card-title">By Status</span></div>
              <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
                {stats?.byStatus?.map(row => (
                  <div key={row.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <StatusBadge status={row.status} /><strong>{row.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Admin Complaints
export function AdminComplaints() {
  //state variables
  const [complaints, setComplaints] = useState([]);
  const [teachers, setTeachers]     = useState([]);
  const [faculties, setFaculties]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab]   = useState('open');
  const [filters, setFilters]       = useState({ status: '', category: '', priority: '' });

  const fetchAll = () => {
    //construct query parameters based on selected filters
    const params = {};
    if (filters.status)   params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;

    Promise.all([
      //fetch complaints with applied filters
      api.get('/complaints', { params }),
      //fetch teachers
      api.get('/users/teachers'),
      //fetch faculties
      api.get('/users/faculties'),
    ]).then(([c, t, f]) => {
      //add complaints, teachers, and faculties to state
      setComplaints(c.data.complaints);
      setTeachers(t.data.teachers);
      setFaculties(f.data.faculties);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [filters]);

  //tabs for filtering complaints by status
  const tabs = [
    { key: 'open',     label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'active',   label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all',      label: 'All' },
  ];

  //filter complaints based on the active tab
  const filtered = complaints.filter(c => {
    if (activeTab === 'open')     return c.status === 'open';
    if (activeTab === 'assigned') return c.status === 'assigned';
    if (activeTab === 'active')   return c.status === 'in_progress';
    if (activeTab === 'resolved') return ['resolved', 'closed'].includes(c.status);
    return true;
  });

  //rendering the admin complaints page
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">All formal complaints submitted to administration</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {/* Filter by status */}
        <select className="form-select" style={{ width: 'auto' }} value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {/* Filter by category */}
        <select className="form-select" style={{ width: 'auto' }} value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {['Academic','Faculty Conduct','Facilities','Administration','Harassment','Financial','Other'].map(c =>
            <option key={c} value={c}>{c}</option>
          )}
        </select>
      </div>

      <div className="tabs">
        {/* Render tabs for filtering complaints by status */}
        {tabs.map(({ key, label }) => {
          const count = key === 'all' ? complaints.length
            : key === 'open'     ? complaints.filter(c => c.status === 'open').length
            : key === 'assigned' ? complaints.filter(c => c.status === 'assigned').length
            : key === 'active'   ? complaints.filter(c => c.status === 'in_progress').length
            : complaints.filter(c => ['resolved','closed'].includes(c.status)).length;
          return (
            <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}<span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>
        {/* Render the list of complaints or an empty state if there are no complaints */}
      <div className="card">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="📭" title="No complaints" description="Nothing in this category." />
        ) : (
          filtered.map(c => (
            <div key={c.id} className="list-row" onClick={() => setSelectedId(c.id)}>
              <div className="list-row-head">
                <div>
                  <div className="list-row-title">{c.title}</div>
                  <div className="list-row-meta">
                    <span>{c.student_name || '🎭 Anonymous'}</span>
                    {c.student_faculty && <span>{c.student_faculty}</span>}
                    <span><TimeAgo date={c.created_at} /></span>
                    {c.assigned_to_name && <span>→ {c.assigned_to_name}</span>}
                    {c.assigned_faculty_name && <span>→ {c.assigned_faculty_name}</span>}
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
        {/* Render the AdminComplaintModal if a complaint is selected */}
      {selectedId && (
        <AdminComplaintModal
          complaintId={selectedId}
          teachers={teachers}
          faculties={faculties}
          onClose={() => setSelectedId(null)}
          onUpdate={fetchAll}
        />
      )}
    </div>
  );
}

// ── Admin Analytics 
export function AdminAnalytics() {

  //state variables
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  //fetch analytics
  useEffect(() => {
    api.get('/complaints/analytics').then(res => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  //rendering analytics page
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Complaint trends and resolution data</p></div></div>
      {loading ? <Spinner /> : (
        <>
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value">{stats?.summary?.total}</div><div className="stat-label">Total Complaints</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.summary?.open}</div><div className="stat-label">Open</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.summary?.resolved}</div><div className="stat-label">Resolved</div></div>
            <div className="stat-card"><div className="stat-value">{stats?.summary?.avg_resolution_hours || '—'}</div><div className="stat-label">Avg Resolution (hrs)</div></div>
          </div>

          {/* By Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">By Status</span></div>
              <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
                {stats?.byStatus?.map(r => (
                  <div key={r.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <StatusBadge status={r.status} /><strong>{r.count}</strong>
                  </div>
                ))}
              </div>
            </div>
            {/* By Priority */}
            <div className="card">
              <div className="card-header"><span className="card-title">By Priority</span></div>
              <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
                {stats?.byPriority?.map(r => (
                  <div key={r.priority} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <PriorityBadge priority={r.priority} /><strong>{r.count}</strong>
                  </div>
                ))}
              </div>
            </div>
            {/* By Category */}
            <div className="card">
              <div className="card-header"><span className="card-title">By Category</span></div>
              <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
                {stats?.byCategory?.map(r => (
                  <div key={r.category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.855rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{r.category}</span><strong>{r.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
          

          {/* Daily Activity Chart */}
          {stats?.dailyActivity?.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header"><span className="card-title">Daily Activity (last 30 days)</span></div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: 80 }}>
                  {stats.dailyActivity.map(d => {
                    const max = Math.max(...stats.dailyActivity.map(x => x.count));
                    const h = max > 0 ? Math.max(4, (d.count / max) * 80) : 4;
                    return (
                      <div key={d.date} title={`${d.date}: ${d.count}`}
                        style={{ flex: 1, height: h, background: 'var(--primary)', borderRadius: '2px 2px 0 0', opacity: 0.75, minWidth: 4 }} />
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  {stats.dailyActivity[0]?.date} → {stats.dailyActivity[stats.dailyActivity.length - 1]?.date}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Admin Users 
export function AdminUsers() {

  // State variables
  const [users, setUsers]       = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'teacher', faculty_id: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users and faculties
  const fetchAll = () => {
    Promise.all([api.get('/users'), api.get('/users/faculties')])
      .then(([u, f]) => { setUsers(u.data.users); setFaculties(f.data.faculties); })
      .finally(() => setLoading(false));
  };

  // Initial fetch on component mount
  useEffect(() => { fetchAll(); }, []);

  // Handle create user
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success('User created!');
      setForm({ name: '', email: '', password: '', role: 'teacher', faculty_id: '' });
      setShowForm(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create user'); }
    finally { setSubmitting(false); }
  };

  // Handle toggle user active/inactive
  const handleToggle = async (id, isActive) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      toast.success(isActive ? 'User deactivated' : 'User activated');
      fetchAll();
    } catch { toast.error('Failed to update'); }
  };

  //define role colors for badges
  const roleColors = { admin: '#C2410C', teacher: '#6D28D9', student: '#2563EB' };

  //rendering manage users page
  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Manage Users</h1><p className="page-subtitle">Create and manage teacher and admin accounts</p></div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}><Plus size={15} /> Add User</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Create Account</span>
            <button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Password</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required /></div>
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                  </select></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Faculty</label>
                  <select className="form-select" value={form.faculty_id} onChange={e => setForm(f => ({ ...f, faculty_id: e.target.value }))}>
                    <option value="">No faculty</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select></div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create Account'}</button>
            </form>
          </div>
        </div>
      )}
      {/* rendering users table */}
      <div className="card">
        {loading ? <Spinner /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Faculty', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Render each user in a table row */}
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.email}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className="badge" style={{ background: `${roleColors[u.role]}18`, color: roleColors[u.role] }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.faculty_name || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge badge-${u.is_active ? 'resolved' : 'closed'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-success'}`}
                      onClick={() => handleToggle(u.id, u.is_active)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
