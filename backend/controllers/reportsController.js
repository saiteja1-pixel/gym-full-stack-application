const prisma = require('../utils/prisma');

/**
 * GET /api/reports/revenue
 * Query parameters: startDate, endDate
 */
async function getRevenueReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Extend to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: {
          select: {
            memberId: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    // Grouping by Month (YYYY-MM) and Payment Method
    const summary = {};
    let totalRevenue = 0;

    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const method = payment.method || 'UNKNOWN';
      const amount = payment.amountPaid || 0;

      totalRevenue += amount;

      if (!summary[month]) {
        summary[month] = {
          month,
          total: 0,
          count: 0,
          methods: {}
        };
      }

      summary[month].total += amount;
      summary[month].count += 1;

      if (!summary[month].methods[method]) {
        summary[month].methods[method] = { total: 0, count: 0 };
      }
      summary[month].methods[method].total += amount;
      summary[month].methods[method].count += 1;
    });

    const monthlySummary = Object.values(summary).sort((a, b) => b.month.localeCompare(a.month));

    res.json({
      payments,
      monthlySummary,
      totalRevenue
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/attendance
 * Query parameters: startDate, endDate, memberId
 */
async function getAttendanceReport(req, res, next) {
  try {
    const { startDate, endDate, memberId } = req.query;

    const where = {};
    if (memberId) {
      where.memberId = memberId;
    }

    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) {
        where.checkInTime.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.checkInTime.lte = end;
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: {
            memberId: true,
            name: true,
            phone: true,
            gender: true
          }
        }
      },
      orderBy: { checkInTime: 'desc' }
    });

    res.json({ attendance });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/members
 * Query parameters: status
 */
async function getMembersReport(req, res, next) {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.membership = {
        status: status
      };
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        membership: {
          include: {
            plan: true
          }
        },
        trainer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ members });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/weight-progress
 * Query parameters: startDate, endDate, memberId
 */
async function getWeightProgressReport(req, res, next) {
  try {
    const { startDate, endDate, memberId } = req.query;

    const where = {};
    if (memberId) {
      where.memberId = memberId;
    }

    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) {
        where.logDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.logDate.lte = end;
      }
    }

    const logs = await prisma.bodyMeasurement.findMany({
      where,
      include: {
        member: {
          select: {
            memberId: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { logDate: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRevenueReport,
  getAttendanceReport,
  getMembersReport,
  getWeightProgressReport
};
