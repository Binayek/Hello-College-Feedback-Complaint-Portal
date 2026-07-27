const pool = require('../config/db');

/**
 * Write a row to audit_logs.
 *
 * @param {object} opts
 * @param {string}      opts.action        - e.g. 'user_login', 'complaint_submitted'
 * @param {string|null} opts.performedBy   - user id of the actor
 * @param {string|null} opts.targetUser    - user id being acted upon (optional)
 * @param {string|null} opts.relatedId     - complaint / post / comment id (optional)
 * @param {string|null} opts.details       - free-text note (optional)
 */
async function audit({ action, performedBy = null, targetUser = null, relatedId = null, details = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, target_user, related_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [action, performedBy, targetUser, relatedId, details]
    );
  } catch (err) {
    // Never let audit failure break a real request
    console.error('[audit] Failed to write log:', err.message);
  }
}

module.exports = audit;
