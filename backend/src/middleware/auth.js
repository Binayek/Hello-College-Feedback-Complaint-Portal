//import required modules
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware to authenticate users based on JWT tokens
const authenticate = async (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;

  //check if the token is present and starts with 'Bearer '
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // Extract the token from the header
  const token = authHeader.split(' ')[1];


  try {
    // Verify the token using the secret key and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Query the database to find the user by ID and check if they are active
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.faculty_id,
              f.name AS faculty_name, f.code AS faculty_code
       FROM users u
       LEFT JOIN faculties f ON u.faculty_id = f.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.userId]
    );
    // If no user is found or the user is inactive, return a 401 Unauthorized response
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
