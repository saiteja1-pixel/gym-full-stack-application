const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  logMeasurement,
  getProgress,
  assignWorkout,
  getWorkoutPlan,
  archiveWorkoutAssignment,
  assignDietPlan,
  getDietPlan,
  logWorkoutProgress,
  logDietEntry,
  getDailyDietLog
} = require('../controllers/fitnessController');

// All routes require JWT authentication
router.use(authenticateJWT);

// ─── Metrics Logging & History ───────────────────────────────────────────────
router.post(
  '/measurements',
  requireRole(['TRAINER']),
  logMeasurement
);

router.get(
  '/progress/:memberId',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'MEMBER']),
  getProgress
);

// ─── Workout Assignment & Tracker ────────────────────────────────────────────
router.post(
  '/workouts',
  requireRole(['TRAINER']),
  assignWorkout
);

router.get(
  '/workouts',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'MEMBER']),
  getWorkoutPlan
);

router.put(
  '/workouts/assignments/:id/archive',
  requireRole(['TRAINER']),
  archiveWorkoutAssignment
);

router.post(
  '/workouts/progress',
  requireRole(['MEMBER']),
  logWorkoutProgress
);

// ─── Diet Planning & Nutrition Tracker ─────────────────────────────────────────
router.post(
  '/diets',
  requireRole(['TRAINER']),
  assignDietPlan
);

router.get(
  '/diets',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'MEMBER']),
  getDietPlan
);

router.post(
  '/diet-logs',
  requireRole(['MEMBER']),
  logDietEntry
);

router.get(
  '/diet-logs/today',
  requireRole(['MEMBER']),
  getDailyDietLog
);

module.exports = router;
