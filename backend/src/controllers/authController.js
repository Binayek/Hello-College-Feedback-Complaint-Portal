const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register — students self-register
const register = async (req, res) => {
  const { name, email, password, faculty_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, faculty_id)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id, name, email, role, faculty_id`,
      [name, email.toLowerCase(), hash, faculty_id || null]
    );
    const token = generateToken(rows[0].id);
    res.status(201).json({ user: rows[0], token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.is_active,
              u.faculty_id, f.name AS faculty_name, f.code AS faculty_code
       FROM users u LEFT JOIN faculties f ON u.faculty_id = f.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, ...safeUser } = user;
    const token = generateToken(user.id);
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/auth/me
const me = (req, res) => res.json({ user: req.user });

module.exports = { register, login, me };
