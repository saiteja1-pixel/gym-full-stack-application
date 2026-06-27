const prisma = require('../utils/prisma');

/**
 * Helper: Find trainer profile ID from logged-in user
 */
async function getTrainerIdFromUser(userId) {
  const trainer = await prisma.trainer.findUnique({
    where: { userId }
  });
  if (!trainer) {
    throw new Error('Trainer profile not found.');
  }
  return trainer.id;
}

/**
 * POST /api/fitness/measurements
 * Log physical metrics measurement
 */
async function logMeasurement(req, res, next) {
  try {
    const {
      memberId,
      weight,
      height,
      bodyFat,
      chest,
      waist,
      hip,
      biceps,
      thigh,
      notes
    } = req.body;

    if (!memberId || weight === undefined || height === undefined) {
      return res.status(400).json({ error: 'memberId, weight, and height are required.' });
    }

    const wt = parseFloat(weight);
    const ht = parseFloat(height);

    if (isNaN(wt) || wt < 30 || wt > 300) {
      return res.status(400).json({ error: 'Weight must be a number between 30 and 300 kg.' });
    }

    if (isNaN(ht) || ht < 100 || ht > 250) {
      return res.status(400).json({ error: 'Height must be a number between 100 and 250 cm.' });
    }

    // Compute BMI: weight / (height/100)^2
    const bmi = parseFloat((wt / Math.pow(ht / 100, 2)).toFixed(2));

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        memberId,
        weight: wt,
        height: ht,
        bmi,
        bodyFat: bodyFat !== undefined && bodyFat !== "" ? parseFloat(bodyFat) : null,
        chest: chest !== undefined && chest !== "" ? parseFloat(chest) : null,
        waist: waist !== undefined && waist !== "" ? parseFloat(waist) : null,
        hip: hip !== undefined && hip !== "" ? parseFloat(hip) : null,
        biceps: biceps !== undefined && biceps !== "" ? parseFloat(biceps) : null,
        thigh: thigh !== undefined && thigh !== "" ? parseFloat(thigh) : null,
        notes: notes || null
      }
    });

    res.status(201).json({
      success: true,
      measurement: {
        id: measurement.id,
        logDate: measurement.logDate,
        bmi: measurement.bmi,
        weight: measurement.weight
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/fitness/progress/:memberId
 * Retrieve weight / measurements trend log
 */
async function getProgress(req, res, next) {
  try {
    const { memberId } = req.params;
    const { range } = req.query;

    const where = { memberId };

    if (range && range !== 'all') {
      let days = 30;
      if (range === '3m') days = 90;
      if (range === '6m') days = 180;

      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      where.logDate = { gte: dateLimit };
    }

    const progress = await prisma.bodyMeasurement.findMany({
      where,
      orderBy: { logDate: 'asc' }
    });

    res.json(progress);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/fitness/workouts
 * Build and assign a workout plan
 */
async function assignWorkout(req, res, next) {
  try {
    const { memberId, title, description, exercises } = req.body;

    if (!memberId || !title || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'memberId, title, and exercises are required.' });
    }

    const trainerId = await getTrainerIdFromUser(req.user.id);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create WorkoutPlan
      const plan = await tx.workoutPlan.create({
        data: {
          trainerId,
          title,
          description: description || null
        }
      });

      // 2. Bulk create Exercises
      const formattedExercises = exercises.map(ex => ({
        workoutPlanId: plan.id,
        exerciseName: ex.exerciseName,
        sets: parseInt(ex.sets, 10),
        reps: parseInt(ex.reps, 10),
        targetWeight: ex.targetWeight !== undefined && ex.targetWeight !== "" ? parseFloat(ex.targetWeight) : null,
        videoUrl: ex.videoUrl || null,
        notes: ex.notes || null
      }));

      await tx.workoutExercise.createMany({
        data: formattedExercises
      });

      // 3. Deactivate previous active workout assignments for this member
      await tx.workoutAssignment.updateMany({
        where: { memberId, isActive: true },
        data: { isActive: false }
      });

      // 4. Create new WorkoutAssignment
      const assignment = await tx.workoutAssignment.create({
        data: {
          workoutPlanId: plan.id,
          memberId,
          isActive: true
        }
      });

      return assignment;
    });

    res.status(201).json({
      success: true,
      assignmentId: result.id
    });
  } catch (err) {
    if (err.message === 'Trainer profile not found.') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/fitness/workouts
 * Retrieve active workout assignment for a member
 */
async function getWorkoutPlan(req, res, next) {
  try {
    const { memberId } = req.query;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId query parameter is required.' });
    }

    const assignment = await prisma.workoutAssignment.findFirst({
      where: {
        memberId: String(memberId),
        isActive: true
      },
      include: {
        workoutPlan: {
          include: {
            exercises: true,
            trainer: {
              select: { name: true }
            }
          }
        }
      }
    });

    res.json(assignment);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/fitness/workouts/assignments/:id/archive
 * Deactivate / archive an assignment
 */
async function archiveWorkoutAssignment(req, res, next) {
  try {
    const { id } = req.params;

    const assignment = await prisma.workoutAssignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Workout assignment not found.' });
    }

    const updated = await prisma.workoutAssignment.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ success: true, assignment: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/fitness/diets
 * Build and assign a diet plan
 */
async function assignDietPlan(req, res, next) {
  try {
    const {
      memberId,
      title,
      breakfast,
      lunch,
      dinner,
      snacks,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      targetWaterMl
    } = req.body;

    if (!memberId || !title || !breakfast || !lunch || !dinner) {
      return res.status(400).json({ error: 'memberId, title, breakfast, lunch, and dinner are required.' });
    }

    const trainerId = await getTrainerIdFromUser(req.user.id);

    const dietPlan = await prisma.dietPlan.create({
      data: {
        trainerId,
        memberId,
        title,
        breakfast,
        lunch,
        dinner,
        snacks: snacks || null,
        targetCalories: targetCalories !== undefined ? parseFloat(targetCalories) : 2000,
        targetProtein: targetProtein !== undefined ? parseFloat(targetProtein) : 120,
        targetCarbs: targetCarbs !== undefined ? parseFloat(targetCarbs) : 200,
        targetFats: targetFats !== undefined ? parseFloat(targetFats) : 60,
        targetWaterMl: targetWaterMl !== undefined ? parseFloat(targetWaterMl) : 3000
      }
    });

    res.status(201).json({
      success: true,
      dietPlan: {
        id: dietPlan.id,
        title: dietPlan.title
      }
    });
  } catch (err) {
    if (err.message === 'Trainer profile not found.') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/fitness/diets
 * Retrieve active diet plan for a member (latest created)
 */
async function getDietPlan(req, res, next) {
  try {
    const { memberId } = req.query;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId query parameter is required.' });
    }

    const dietPlan = await prisma.dietPlan.findFirst({
      where: {
        memberId: String(memberId)
      },
      include: {
        trainer: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(dietPlan);
  } catch (err) {
    next(err);
  }
}

async function logWorkoutProgress(req, res, next) {
  try {
    const { memberId, assignmentId, completed, feedback } = req.body;

    if (!memberId || !assignmentId) {
      return res.status(400).json({ error: 'memberId and assignmentId are required.' });
    }

    const progress = await prisma.workoutProgress.create({
      data: {
        memberId,
        assignmentId,
        completed: !!completed,
        feedback: feedback || null
      }
    });

    res.status(201).json({
      success: true,
      logId: progress.id
    });
  } catch (err) {
    next(err);
  }
}

async function logDietEntry(req, res, next) {
  try {
    const { memberId, dietPlanId, waterIntakeMl, caloriesLog, proteinLog } = req.body;

    if (!memberId || !dietPlanId) {
      return res.status(400).json({ error: 'memberId and dietPlanId are required.' });
    }

    const water = parseFloat(waterIntakeMl || 0);
    const calories = parseFloat(caloriesLog || 0);
    const protein = parseFloat(proteinLog || 0);

    if (water < 0 || calories < 0 || protein < 0) {
      return res.status(400).json({ error: 'Negative values are not allowed.' });
    }

    await prisma.dietLog.create({
      data: {
        memberId,
        dietPlanId,
        waterIntakeMl: water,
        caloriesLog: calories,
        proteinLog: protein
      }
    });

    // Compute total water logged today (midnight to 23:59:59.999 local date)
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const logsToday = await prisma.dietLog.findMany({
      where: {
        memberId,
        logDate: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const totalWaterLoggedToday = logsToday.reduce((sum, log) => sum + log.waterIntakeMl, 0);

    res.status(201).json({
      success: true,
      totalWaterLoggedToday
    });
  } catch (err) {
    next(err);
  }
}

async function getDailyDietLog(req, res, next) {
  try {
    const { memberId, date } = req.query;

    if (!memberId || !date) {
      return res.status(400).json({ error: 'memberId and date are required.' });
    }

    // Parsed date: YYYY-MM-DD
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
    const day = parseInt(dateParts[2], 10);

    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    // Get active diet plan to fetch target goals
    const dietPlan = await prisma.dietPlan.findFirst({
      where: { memberId: String(memberId) },
      orderBy: { createdAt: 'desc' }
    });

    const target = {
      calories: dietPlan ? dietPlan.targetCalories : 2000,
      protein: dietPlan ? dietPlan.targetProtein : 100,
      water: dietPlan ? dietPlan.targetWaterMl : 3000
    };

    // Aggregate consumed
    const logs = await prisma.dietLog.findMany({
      where: {
        memberId,
        logDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const consumed = logs.reduce(
      (acc, log) => {
        acc.calories += log.caloriesLog;
        acc.protein += log.proteinLog;
        acc.water += log.waterIntakeMl;
        return acc;
      },
      { calories: 0, protein: 0, water: 0 }
    );

    res.json({ target, consumed });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
