const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const profanityFilter = require("../middleware/profanityFilter");
const moderation = require('../middleware/moderation');
const decisionEngine = require('../middleware/decisionEngine');


const auth       = require('../controllers/authController');
const community  = require('../controllers/communityController');
const complaints = require('../controllers/complaintController');
const users      = require('../controllers/userController');

// ── Auth ──────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login',    auth.login);
router.get ('/auth/me',       authenticate, auth.me);

// ── Community Board ───────────────────────────────────────
router.get   ('/community/categories', authenticate, community.getCategories);
router.get   ('/community',            authenticate, community.getPosts);
router.get   ('/community/:id',        authenticate, community.getPost);
router.post  ('/community',            authenticate, profanityFilter, moderation, decisionEngine, community.createPost);
router.post  ('/community/:id/comments', authenticate, profanityFilter, moderation, decisionEngine, community.addComment);
router.delete('/community/:id',        authenticate, authorize('admin'), community.removePost);

// ── Complaints ────────────────────────────────────────────
// Student
router.post('/complaints', authenticate, authorize('student'), profanityFilter, moderation, decisionEngine, complaints.submitComplaint);
router.get ('/complaints/mine',  authenticate, authorize('student'), complaints.getMyComplaints);

// Teacher
router.get ('/complaints/assigned',           authenticate, authorize('teacher'), complaints.getAssignedComplaints);
router.post('/complaints/:id/respond',        authenticate, authorize('teacher'), profanityFilter, moderation, decisionEngine, complaints.respondToComplaint);

// Admin
router.get  ('/complaints/analytics',         authenticate, authorize('admin'), complaints.getAnalytics);
router.get  ('/complaints',                   authenticate, authorize('admin'), complaints.getAllComplaints);
router.post ('/complaints/:id/assign',        authenticate, authorize('admin'), complaints.assignComplaint);
router.patch('/complaints/:id/status',        authenticate, authorize('admin'), complaints.updateStatus);
router.patch('/complaints/:id/reveal',        authenticate, authorize('admin'), complaints.revealIdentity);

// Shared — authenticated users (student sees own, teacher/admin see all)
router.get('/complaints/:id', authenticate, complaints.getComplaint);

// ── Users ─────────────────────────────────────────────────
router.get  ('/users/teachers',      authenticate, users.getTeachers);
router.get  ('/users/faculties',     users.getFaculties);
router.get  ('/users',               authenticate, authorize('admin'), users.getAllUsers);
router.post ('/users',               authenticate, authorize('admin'), users.createUser);
router.patch('/users/:id/toggle',    authenticate, authorize('admin'), users.toggleUserStatus);

// ── Notifications ─────────────────────────────────────────
router.get  ('/notifications',       authenticate, users.getNotifications);
router.patch('/notifications/read',  authenticate, users.markNotificationsRead);

module.exports = router;
