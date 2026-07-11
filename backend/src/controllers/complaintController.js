const pool = require('../config/db');

// ── STUDENT ────────────────────────────────────────────────

// POST /api/complaints — student files complaint
const submitComplaint = async (req, res) => {
  const { title, description, category, priority, is_anonymous } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO complaints (title, description, category, priority, is_anonymous, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, category, priority, status, is_anonymous, created_at`,
      [title, description, category || null, priority || 'medium', is_anonymous || false, req.user.id]
    );

    // Notify all admins
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE");
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, link)
         VALUES ($1, 'complaint_submitted', $2, $3)`,
        [admin.id, `New complaint submitted: "${title}"`, `/complaints/${rows[0].id}`]
      );
    }

    res.status(201).json({ complaint: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

// GET /api/complaints/mine — student views own complaints
const getMyComplaints = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.title, c.description, c.category, c.priority,
        c.status, c.is_anonymous, c.identity_revealed,
        c.resolved_at, c.created_at, c.updated_at,
        -- latest assignment
        ca.assigned_to_type,
        assigned_user.name AS assigned_to_name,
        af.name            AS assigned_faculty_name,
        -- latest response
        (SELECT content FROM complaint_responses
         WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) AS latest_response
      FROM complaints c
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id
        AND ca.id = (SELECT id FROM complaint_assignments WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1)
      LEFT JOIN users    assigned_user ON ca.assigned_to = assigned_user.id
      LEFT JOIN faculties af           ON ca.faculty_id = af.id
      WHERE c.created_by = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json({ complaints: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// GET /api/complaints/:id — detail view (student can see own, teacher/admin can see all)
const getComplaint = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.*,
        CASE WHEN c.is_anonymous AND NOT c.identity_revealed THEN NULL ELSE u.name  END AS student_name,
        CASE WHEN c.is_anonymous AND NOT c.identity_revealed THEN NULL ELSE u.email END AS student_email,
        uf.name AS student_faculty,
        ca.assigned_to_type,
        assigned_user.name AS assigned_to_name,
        af.name            AS assigned_faculty_name,
        revealer.name      AS revealed_by_name
      FROM complaints c
      LEFT JOIN users    u              ON c.created_by = u.id
      LEFT JOIN faculties uf            ON u.faculty_id = uf.id
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id
        AND ca.id = (SELECT id FROM complaint_assignments WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1)
      LEFT JOIN users    assigned_user  ON ca.assigned_to = assigned_user.id
      LEFT JOIN faculties af            ON ca.faculty_id = af.id
      LEFT JOIN users    revealer       ON c.identity_revealed_by = revealer.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Complaint not found' });

    const complaint = rows[0];

    // Students can only view their own
    if (req.user.role === 'student' && complaint.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch all responses
    const responses = await pool.query(`
      SELECT cr.id, cr.content, cr.new_status, cr.created_at,
             u.name AS responder_name, u.role AS responder_role
      FROM complaint_responses cr
      LEFT JOIN users u ON cr.responder_id = u.id
      WHERE cr.complaint_id = $1
      ORDER BY cr.created_at ASC
    `, [req.params.id]);

    res.json({ complaint, responses: responses.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
};

// ── ADMIN ──────────────────────────────────────────────────

// GET /api/complaints — admin views all
const getAllComplaints = async (req, res) => {
  const { status, category, priority, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (status)   { params.push(status);   conditions.push(`c.status = $${params.length}`); }
  if (category) { params.push(category); conditions.push(`c.category = $${params.length}`); }
  if (priority) { params.push(priority); conditions.push(`c.priority = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.title, c.category, c.priority, c.status,
        c.is_anonymous, c.identity_revealed, c.created_at, c.updated_at,
        CASE WHEN c.is_anonymous AND NOT c.identity_revealed THEN NULL ELSE u.name  END AS student_name,
        CASE WHEN c.is_anonymous AND NOT c.identity_revealed THEN NULL ELSE u.email END AS student_email,
        uf.name AS student_faculty,
        assigned_user.name AS assigned_to_name,
        af.name            AS assigned_faculty_name
      FROM complaints c
      LEFT JOIN users u             ON c.created_by = u.id
      LEFT JOIN faculties uf        ON u.faculty_id = uf.id
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id
        AND ca.id = (SELECT id FROM complaint_assignments WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1)
      LEFT JOIN users    assigned_user ON ca.assigned_to = assigned_user.id
      LEFT JOIN faculties af           ON ca.faculty_id = af.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const countRes = await pool.query(
      `SELECT COUNT(*)::int FROM complaints c ${where}`, params
    );

    res.json({ complaints: rows, total: countRes.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// POST /api/complaints/:id/assign — admin assigns to teacher or faculty
const assignComplaint = async (req, res) => {
  const { assigned_to, assigned_to_type, faculty_id, remarks } = req.body;

  if (!assigned_to_type) {
    return res.status(400).json({ error: 'assigned_to_type (teacher|faculty) is required' });
  }

  try {
    // Insert assignment record
    await pool.query(
      `INSERT INTO complaint_assignments (complaint_id, assigned_to_type, assigned_to, faculty_id, assigned_by, remarks)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.params.id, assigned_to_type, assigned_to || null, faculty_id || null, req.user.id, remarks || null]
    );

    // Update complaint status
    await pool.query(
      `UPDATE complaints SET status = 'assigned', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    // Notify assigned teacher
    if (assigned_to) {
      const complaint = await pool.query('SELECT title FROM complaints WHERE id = $1', [req.params.id]);
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, link)
         VALUES ($1, 'complaint_assigned', $2, $3)`,
        [assigned_to, `Complaint assigned to you: "${complaint.rows[0]?.title}"`, `/teacher/complaints/${req.params.id}`]
      );
    }

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, related_id, details)
       VALUES ('assign_complaint', $1, $2, $3)`,
      [req.user.id, req.params.id, `Assigned to type=${assigned_to_type}`]
    );

    res.json({ message: 'Complaint assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign complaint' });
  }
};

// PATCH /api/complaints/:id/status — admin updates status + optional remarks
const updateStatus = async (req, res) => {
  const { status, remarks } = req.body;
  const valid = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    await pool.query(
      `UPDATE complaints
       SET status = $1,
           resolved_at = CASE WHEN $1 IN ('resolved','closed') THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $2`,
      [status, req.params.id]
    );

    if (remarks) {
      await pool.query(
        `INSERT INTO complaint_responses (complaint_id, responder_id, content, new_status)
         VALUES ($1, $2, $3, $4)`,
        [req.params.id, req.user.id, remarks, status]
      );
    }

    // Notify student
    const comp = await pool.query(
      'SELECT created_by, is_anonymous, title FROM complaints WHERE id = $1',
      [req.params.id]
    );
    const c = comp.rows[0];
    if (c.created_by) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, link)
         VALUES ($1, 'complaint_status_changed', $2, $3)`,
        [c.created_by, `Your complaint "${c.title}" status changed to: ${status}`, `/complaints/${req.params.id}`]
      );
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// PATCH /api/complaints/:id/reveal — admin reveals anonymous identity
const revealIdentity = async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required' });

  try {
    const { rows } = await pool.query(
      'SELECT is_anonymous, identity_revealed, created_by, title FROM complaints WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Complaint not found' });
    if (!rows[0].is_anonymous) return res.status(400).json({ error: 'Complaint is not anonymous' });
    if (rows[0].identity_revealed) return res.status(400).json({ error: 'Identity already revealed' });

    await pool.query(
      `UPDATE complaints
       SET identity_revealed = TRUE, identity_revealed_by = $1,
           identity_revealed_reason = $2, updated_at = NOW()
       WHERE id = $3`,
      [req.user.id, reason, req.params.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, target_user, related_id, details)
       VALUES ('reveal_identity', $1, $2, $3, $4)`,
      [req.user.id, rows[0].created_by, req.params.id, reason]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, link)
       VALUES ($1, 'identity_revealed', $2, $3)`,
      [rows[0].created_by, `Your identity has been revealed for complaint: "${rows[0].title}"`, `/complaints/${req.params.id}`]
    );

    const student = await pool.query(
      'SELECT name, email, faculty_id FROM users WHERE id = $1',
      [rows[0].created_by]
    );

    res.json({ student: student.rows[0], message: 'Identity revealed and logged' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reveal identity' });
  }
};

// GET /api/complaints/analytics — admin dashboard stats
const getAnalytics = async (req, res) => {
  try {
    const [byStatus, byCategory, byPriority, summary, daily] = await Promise.all([
      pool.query(`SELECT status, COUNT(*)::int AS count FROM complaints GROUP BY status`),
      pool.query(`SELECT category, COUNT(*)::int AS count FROM complaints WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 8`),
      pool.query(`SELECT priority, COUNT(*)::int AS count FROM complaints GROUP BY priority`),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status IN ('resolved','closed') THEN 1 END)::int AS resolved,
          COUNT(CASE WHEN status = 'open' THEN 1 END)::int AS open,
          COUNT(CASE WHEN is_anonymous THEN 1 END)::int AS anonymous_count,
          ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric, 1) AS avg_resolution_hours
        FROM complaints
      `),
      pool.query(`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count
        FROM complaints
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `),
    ]);

    res.json({
      byStatus: byStatus.rows,
      byCategory: byCategory.rows,
      byPriority: byPriority.rows,
      summary: summary.rows[0],
      dailyActivity: daily.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// ── TEACHER ────────────────────────────────────────────────

// GET /api/complaints/assigned — teacher views complaints assigned to them
const getAssignedComplaints = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.title, c.description, c.category, c.priority,
        c.status, c.is_anonymous, c.created_at, c.updated_at,
        CASE WHEN c.is_anonymous AND NOT c.identity_revealed THEN NULL ELSE u.name  END AS student_name,
        CASE WHEN c.is_anonymous AND NOT c.identity_revealed THEN NULL ELSE u.email END AS student_email,
        uf.name AS student_faculty,
        ca.remarks AS assignment_remarks, ca.created_at AS assigned_at
      FROM complaint_assignments ca
      JOIN complaints c ON ca.complaint_id = c.id
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN faculties uf ON u.faculty_id = uf.id
      WHERE ca.assigned_to = $1
        AND ca.id = (SELECT id FROM complaint_assignments WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1)
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json({ complaints: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assigned complaints' });
  }
};

// POST /api/complaints/:id/respond — teacher responds and optionally updates status
const respondToComplaint = async (req, res) => {
  const { content, new_status } = req.body;
  if (!content) return res.status(400).json({ error: 'Response content is required' });

  const validStatuses = ['in_progress', 'resolved'];
  const status = validStatuses.includes(new_status) ? new_status : null;

  try {
    // Verify teacher is assigned to this complaint
    const check = await pool.query(
      `SELECT id FROM complaint_assignments
       WHERE complaint_id = $1 AND assigned_to = $2
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(403).json({ error: 'You are not assigned to this complaint' });

    await pool.query(
      `INSERT INTO complaint_responses (complaint_id, responder_id, content, new_status)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, req.user.id, content, status]
    );

    if (status) {
      await pool.query(
        `UPDATE complaints SET status = $1,
         resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
         updated_at = NOW()
         WHERE id = $2`,
        [status, req.params.id]
      );
    }

    // Notify student
    const comp = await pool.query(
      'SELECT created_by, title FROM complaints WHERE id = $1',
      [req.params.id]
    );
    if (comp.rows[0]?.created_by) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, link)
         VALUES ($1, 'complaint_status_changed', $2, $3)`,
        [comp.rows[0].created_by,
         `A response was added to your complaint: "${comp.rows[0].title}"`,
         `/complaints/${req.params.id}`]
      );
    }

    res.json({ message: 'Response submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit response' });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getComplaint,
  getAllComplaints,
  assignComplaint,
  updateStatus,
  revealIdentity,
  getAnalytics,
  getAssignedComplaints,
  respondToComplaint,
};
