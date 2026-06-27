const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  sendNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationsController');
const { runDailyChecks } = require('../utils/cronJobs');

// All routes require authentication
router.use(authenticateJWT);

router.post('/trigger-cron', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    await runDailyChecks();
    res.json({ message: 'Cron daily checks executed successfully.' });
  } catch (error) {
    next(error);
  }
});

router.post('/send', requireRole(['ADMIN', 'SUPER_ADMIN', 'TRAINER']), sendNotification);
router.get('/my', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);


module.exports = router;
