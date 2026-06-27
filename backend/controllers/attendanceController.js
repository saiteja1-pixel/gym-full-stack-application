const prisma = require('../utils/prisma');

/**
 * POST /api/attendance/scan
 * Scans a member's cryptographic QR token and validates check-in.
 */
async function scanAttendance(req, res, next) {
  try {
    const { qrCodeToken } = req.body;

    if (!qrCodeToken) {
      return res.status(400).json({ error: 'qrCodeToken is required in body.' });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check 1: Find matching member in DB
    const member = await prisma.member.findUnique({
      where: { qrCodeToken },
      include: {
        membership: {
          include: { plan: true }
        }
      }
    });

    if (!member) {
      // Return 404 immediately. Do not write log since memberId is missing.
      return res.status(404).json({
        error: 'Access Denied: Invalid or untrusted QR Code.',
        denialCode: 'INVALID_TOKEN'
      });
    }

    const memberId = member.id;

    // Check 2: Membership expiry check
    if (!member.membership) {
      await prisma.attendance.create({
        data: { memberId, status: 'EXPIRED_PLAN' }
      });
      return res.status(400).json({
        error: 'Access Denied: No active membership plan found.',
        denialCode: 'EXPIRED_PLAN'
      });
    }

    const expiryDate = new Date(member.membership.endDate);
    if (expiryDate < todayStart) {
      await prisma.attendance.create({
        data: { memberId, status: 'EXPIRED_PLAN' }
      });
      return res.status(400).json({
        error: 'Access Denied: Membership plan has expired.',
        denialCode: 'EXPIRED_PLAN'
      });
    }

    // Check 3: Membership Status check (FROZEN/CANCELLED/EXPIRED)
    const membershipStatus = member.membership.status;
    if (membershipStatus === 'FROZEN') {
      await prisma.attendance.create({
        data: { memberId, status: 'FROZEN' }
      });
      return res.status(400).json({
        error: 'Access Denied: Membership is currently frozen.',
        denialCode: 'FROZEN'
      });
    }

    if (membershipStatus === 'CANCELLED') {
      await prisma.attendance.create({
        data: { memberId, status: 'CANCELLED' }
      });
      return res.status(400).json({
        error: 'Access Denied: Membership has been cancelled.',
        denialCode: 'CANCELLED'
      });
    }

    if (membershipStatus === 'EXPIRED') {
      await prisma.attendance.create({
        data: { memberId, status: 'EXPIRED_PLAN' }
      });
      return res.status(400).json({
        error: 'Access Denied: Membership status marked as expired.',
        denialCode: 'EXPIRED_PLAN'
      });
    }

    // Check 4: Payment check (Latest payment must be PAID or PARTIAL)
    const latestPayment = await prisma.payment.findFirst({
      where: { memberId },
      orderBy: { paymentDate: 'desc' }
    });

    if (!latestPayment || (latestPayment.status !== 'PAID' && latestPayment.status !== 'PARTIAL')) {
      await prisma.attendance.create({
        data: { memberId, status: 'UNPAID' }
      });
      return res.status(400).json({
        error: 'Access Denied: Outstanding payment balance is due.',
        denialCode: 'UNPAID'
      });
    }

    // Check 5: Duplicate scan check (within last 60 minutes)
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
    const duplicateCheck = await prisma.attendance.findFirst({
      where: {
        memberId,
        status: 'VALID',
        checkInTime: {
          gte: sixtyMinutesAgo
        }
      }
    });

    if (duplicateCheck) {
      await prisma.attendance.create({
        data: { memberId, status: 'DUPLICATE' }
      });
      return res.status(400).json({
        error: 'Access Denied: Duplicate scan. Already checked in within the hour.',
        denialCode: 'DUPLICATE'
      });
    }

    // ON PASS: Create VALID check-in log
    await prisma.attendance.create({
      data: { memberId, status: 'VALID' }
    });

    res.status(200).json({
      success: true,
      member: {
        name: member.name,
        avatarUrl: member.avatarUrl,
        planName: member.membership.plan.name,
        endDate: member.membership.endDate
      }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/logs
 * Retrieve paginated check-in logs with filters.
 */
async function getLogs(req, res, next) {
  try {
    const { memberId, status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (memberId) {
      where.memberId = memberId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) {
        where.checkInTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.checkInTime.lte = new Date(endDate);
      }
    }

    const [logs, totalCount] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: {
            select: {
              name: true,
              memberId: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { checkInTime: 'desc' }
      }),
      prisma.attendance.count({ where })
    ]);

    res.json({
      logs,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  scanAttendance,
  getLogs
};
