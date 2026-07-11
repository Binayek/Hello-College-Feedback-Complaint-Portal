const pool = require('../config/db');

// GET /api/community
const getPosts = async (req, res) => {
  const { category, search } = req.query;
  let where = "WHERE cp.status = 'active'";
  const params = [];

  if (category) { params.push(category); where += ` AND cp.category = $${params.length}`; }
  if (search)   { params.push(`%${search}%`); where += ` AND (cp.title ILIKE $${params.length} OR cp.content ILIKE $${params.length})`; }

  try {
    const { rows } = await pool.query(`
      SELECT
        cp.id, cp.title, cp.content, cp.category, cp.is_anonymous, cp.created_at,
        CASE WHEN cp.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN cp.is_anonymous THEN NULL ELSE f.name END AS author_faculty,
        CASE WHEN cp.is_anonymous THEN NULL ELSE u.role END AS author_role,
        COUNT(pc.id)::int AS comment_count
      FROM community_posts cp
      LEFT JOIN users u    ON cp.author_id = u.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN post_comments pc ON cp.id = pc.post_id AND pc.status = 'active'
      ${where}
      GROUP BY cp.id, u.name, f.name, u.role
      ORDER BY cp.created_at DESC
    `, params);
    res.json({ posts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// GET /api/community/:id
const getPost = async (req, res) => {
  try {
    const postRes = await pool.query(`
      SELECT
        cp.id, cp.title, cp.content, cp.category, cp.is_anonymous, cp.created_at,
        CASE WHEN cp.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN cp.is_anonymous THEN NULL ELSE f.name END AS author_faculty,
        CASE WHEN cp.is_anonymous THEN NULL ELSE u.role END AS author_role
      FROM community_posts cp
      LEFT JOIN users u ON cp.author_id = u.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      WHERE cp.id = $1 AND cp.status = 'active'
    `, [req.params.id]);

    if (!postRes.rows.length) return res.status(404).json({ error: 'Post not found' });

    const commentsRes = await pool.query(`
      SELECT
        pc.id, pc.content, pc.is_anonymous, pc.created_at,
        CASE WHEN pc.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN pc.is_anonymous THEN NULL ELSE u.role END AS author_role
      FROM post_comments pc
      LEFT JOIN users u ON pc.author_id = u.id
      WHERE pc.post_id = $1 AND pc.status = 'active'
      ORDER BY pc.created_at ASC
    `, [req.params.id]);

    res.json({ post: postRes.rows[0], comments: commentsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// POST /api/community
const createPost = async (req, res) => {
  const { title, content, category, is_anonymous } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO community_posts (author_id, is_anonymous, title, content, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, is_anonymous || false, title, content, category || null]
    );
    res.status(201).json({ post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// POST /api/community/:id/comments
const addComment = async (req, res) => {
  const { content, is_anonymous } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const check = await pool.query(
      "SELECT id FROM community_posts WHERE id = $1 AND status = 'active'",
      [req.params.id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Post not found' });

    const { rows } = await pool.query(
      `INSERT INTO post_comments (post_id, author_id, is_anonymous, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, is_anonymous || false, content]
    );

    // Notify post author (if not anonymous and not same user)
    const postAuthor = await pool.query(
      'SELECT author_id, is_anonymous FROM community_posts WHERE id = $1',
      [req.params.id]
    );
    const pa = postAuthor.rows[0];
    if (pa.author_id && pa.author_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, link)
         VALUES ($1, 'community_comment', $2, $3)`,
        [pa.author_id, 'Someone commented on your community post', `/community/${req.params.id}`]
      );
    }

    res.status(201).json({ comment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// DELETE /api/community/:id — admin only
const removePost = async (req, res) => {
  try {
    await pool.query("UPDATE community_posts SET status = 'removed' WHERE id = $1", [req.params.id]);
    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, related_id, details)
       VALUES ('remove_community_post', $1, $2, 'Post removed by admin')`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Post removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove post' });
  }
};

// GET /api/community/categories
const getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category FROM community_posts
       WHERE category IS NOT NULL AND status = 'active'
       ORDER BY category`
    );
    res.json({ categories: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

module.exports = { getPosts, getPost, createPost, addComment, removePost, getCategories };
