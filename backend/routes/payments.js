const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  createInvoice,
  getLedger,
  getMemberPayments
} = require('../controllers/paymentsController');

// All routes require JWT authentication
router.use(authenticateJWT);

// ─── Payment & Invoicing Routes ──────────────────────────────────────────────
router.post(
  '/invoice',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  createInvoice
);

router.get(
  '/ledger',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  getLedger
);

router.get(
  '/member/:memberId',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'MEMBER']),
  getMemberPayments
);

module.exports = router;
