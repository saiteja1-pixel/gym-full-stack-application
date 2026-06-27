const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  getRevenueReport,
  getAttendanceReport,
  getMembersReport,
  getWeightProgressReport
} = require('../controllers/reportsController');

// All routes require authentication and admin access
router.use(authenticateJWT);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/revenue', getRevenueReport);
router.get('/attendance', getAttendanceReport);
router.get('/members', getMembersReport);
router.get('/weight-progress', getWeightProgressReport);

module.exports = router;
