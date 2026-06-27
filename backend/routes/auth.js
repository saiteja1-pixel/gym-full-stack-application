const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { login, getMe, refreshQrToken } = require('../controllers/authController');

// POST /api/auth/login — Public route
router.post('/login', login);

// GET /api/auth/me — Protected route
router.get('/me', authenticateJWT, getMe);

// POST /api/auth/refresh-qr — Protected route
router.post('/refresh-qr', authenticateJWT, refreshQrToken);

module.exports = router;
