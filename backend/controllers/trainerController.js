const prisma = require('../utils/prisma');

/**
 * GET /api/trainer/members
 * Retrieve members assigned to the logged-in trainer
 */
async function getAssignedMembers(req, res, next) {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { userId: req.user.id }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer profile not found.' });
    }

    const members = await prisma.member.findMany({
      where: { trainerId: trainer.id },
      include: {
        bodyMeasurements: {
          orderBy: { logDate: 'desc' },
          take: 1
        },
        membership: {
          include: { plan: true }
        },
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format output fields: Initial params, Latest metrics, Active plan, Expiry info
    const formattedMembers = members.map(m => {
      const latestMeas = m.bodyMeasurements[0] || null;
      const latestWeight = latestMeas ? latestMeas.weight : m.initialWeight;
      const latestHeight = latestMeas ? latestMeas.height : m.initialHeight;
      const latestBmi = latestMeas ? latestMeas.bmi : parseFloat((m.initialWeight / Math.pow(m.initialHeight / 100, 2)).toFixed(2));
      const lastMeasurementDate = latestMeas ? latestMeas.logDate : m.createdAt;

      return {
        id: m.id,
        memberId: m.memberId,
        name: m.name,
        phone: m.phone,
        email: m.user?.email || "N/A",
        avatarUrl: m.avatarUrl,
        initialWeight: m.initialWeight,
        initialHeight: m.initialHeight,
        latestWeight,
        latestHeight,
        latestBmi,
        lastMeasurementDate,
        activePlan: m.membership?.plan?.name || "No Active Plan",
        membershipStatus: m.membership?.status || "EXPIRED"
      };
    });

    res.json(formattedMembers);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trainer/activity
 * Retrieve checklist completions and nutrition logs feed for assigned members
 */
async function getTrainerActivity(req, res, next) {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { userId: req.user.id }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer profile not found.' });
    }

    // Get list of assigned member IDs
    const assignedMembers = await prisma.member.findMany({
      where: { trainerId: trainer.id },
      select: { id: true }
    });
    const memberIds = assignedMembers.map(m => m.id);

    // Fetch latest 10 workout completions
    const workoutLogs = await prisma.workoutProgress.findMany({
      where: {
        memberId: { in: memberIds },
        completed: true
      },
      take: 10,
      orderBy: { logDate: 'desc' },
      include: {
        member: { select: { name: true } }
      }
    });

    // Fetch latest 10 diet logs
    const dietLogs = await prisma.dietLog.findMany({
      where: { memberId: { in: memberIds } },
      take: 10,
      orderBy: { logDate: 'desc' },
      include: {
        member: { select: { name: true } }
      }
    });

    // Merge and format
    const feed = [];
    workoutLogs.forEach(log => {
      feed.push({
        id: `workout-${log.id}`,
        type: 'WORKOUT',
        title: 'Workout Checklist Cleared',
        description: `${log.member.name} completed assigned sets. Feedback: ${log.feedback || 'None'}`,
        date: log.logDate
      });
    });

    dietLogs.forEach(log => {
      feed.push({
        id: `diet-${log.id}`,
        type: 'DIET',
        title: 'Nutrition Target Logged',
        description: `${log.member.name} logged water (${log.waterIntakeMl} ml) & protein (${log.proteinLog} g).`,
        date: log.logDate
      });
    });

    // Sort by date descending, take top 10
    const activityFeed = feed
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json(activityFeed);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssignedMembers,
  getTrainerActivity
};
