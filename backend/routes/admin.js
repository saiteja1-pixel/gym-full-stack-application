const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  createPlan,
  listPlans,
  updatePlan,
  deletePlan,
  listTrainers,
  registerMember,
  listMembers,
  getMemberDetails,
  updateMember,
  freezeMember,
  renewMember,
  getDashboardStats,
  registerTrainer
} = require('../controllers/adminController');

// All routes require JWT authentication
router.use(authenticateJWT);

// ─── Membership Plan Routes ──────────────────────────────────────────────────
router.post(
  '/membership-plans',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  createPlan
);
router.get(
  '/membership-plans',
  listPlans // Available to all roles so members and trainers can view plans
);
router.put(
  '/membership-plans/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  updatePlan
);
router.delete(
  '/membership-plans/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  deletePlan
);

// ─── Trainer Dropdown Routes ──────────────────────────────────────────────────
router.get(
  '/trainers',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  listTrainers
);
router.post(
  '/trainers',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  registerTrainer
);

// ─── Dashboard Stats Routes ───────────────────────────────────────────────────
router.get(
  '/dashboard-stats',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  getDashboardStats
);

// ─── Member Management Routes ────────────────────────────────────────────────
router.post(
  '/members',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  registerMember
);
router.get(
  '/members',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TRAINER']),
  listMembers
);
router.get(
  '/members/:id',
  getMemberDetails // Controller handles validating if caller has access
);
router.put(
  '/members/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  updateMember
);
router.put(
  '/members/:id/freeze',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  freezeMember
);
router.put(
  '/members/:id/renew',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  renewMember
);

module.exports = router;
