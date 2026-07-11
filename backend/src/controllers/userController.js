const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/users/teachers — all roles
const getTeachers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.faculty_id, f.name AS faculty_name, f.code AS faculty_code
       FROM users u LEFT JOIN faculties f ON u.faculty_id = f.id
       WHERE u.role = 'teacher' AND u.is_active = TRUE ORDER BY u.name`
    );
    res.json({ teachers: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

// GET /api/users/faculties — all roles
const getFaculties = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM faculties ORDER BY name');
    res.json({ faculties: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculties' });
  }
};

// GET /api/users — admin only
const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              f.name AS faculty_name, f.code AS faculty_code
       FROM users u LEFT JOIN faculties f ON u.faculty_id = f.id
       ORDER BY u.role, u.name`
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// POST /api/users — admin creates teacher/admin accounts
const createUser = async (req, res) => {
  const { name, email, password, role, faculty_id } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, faculty_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, faculty_id`,
      [name, email.toLowerCase(), hash, role, faculty_id || null]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// PATCH /api/users/:id/toggle — admin
const toggleUserStatus = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING id, name, is_active`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// GET /api/notifications — current user's notifications
const getNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    res.json({ notifications: rows, unread });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// PATCH /api/notifications/read — mark all read
const markNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
};

module.exports = {
  getTeachers, getFaculties, getAllUsers, createUser,
  toggleUserStatus, getNotifications, markNotificationsRead,
};
