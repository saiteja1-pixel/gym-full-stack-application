const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { scanAttendance, getLogs } = require('../controllers/attendanceController');

// All routes require JWT authentication
router.use(authenticateJWT);

// ─── Attendance Scan & Logs Routes ───────────────────────────────────────────
router.post(
  '/scan',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  scanAttendance
);

router.get(
  '/logs',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TRAINER']),
  getLogs
);

module.exports = router;
