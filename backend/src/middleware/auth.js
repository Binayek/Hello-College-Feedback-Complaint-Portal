const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.faculty_id,
              f.name AS faculty_name, f.code AS faculty_code
       FROM users u
       LEFT JOIN faculties f ON u.faculty_id = f.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Usage: authorize('admin') or authorize('admin', 'teacher')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = { authenticate, authorize };
