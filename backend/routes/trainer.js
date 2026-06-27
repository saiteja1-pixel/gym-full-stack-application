const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { getAssignedMembers, getTrainerActivity } = require('../controllers/trainerController');

// All routes require JWT authentication
router.use(authenticateJWT);

// ─── Trainer Portal Routes ───────────────────────────────────────────────────
router.get(
  '/members',
  requireRole(['TRAINER']),
  getAssignedMembers
);

router.get(
  '/activity',
  requireRole(['TRAINER']),
  getTrainerActivity
);

module.exports = router;
