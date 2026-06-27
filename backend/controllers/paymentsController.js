const prisma = require('../utils/prisma');

/**
 * POST /api/payments/invoice
 * Record a manual payment / generate an invoice
 */
async function createInvoice(req, res, next) {
  try {
    const { memberId, planId, amountPaid, totalAmount, taxAmount, method, notes } = req.body;

    if (!memberId || !planId || amountPaid === undefined || totalAmount === undefined || taxAmount === undefined || !method) {
      return res.status(400).json({ error: 'memberId, planId, amountPaid, totalAmount, taxAmount, and method are required.' });
    }

    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    const result = await prisma.$transaction(async (tx) => {
      // Find latest invoice to compute sequential number
      const latestPayment = await tx.payment.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: 'desc' }
      });

      let nextNum = 1;
      if (latestPayment) {
        const parts = latestPayment.invoiceNumber.split('-');
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      const invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

      // Retrieve member profile
      const member = await tx.member.findUnique({
        where: { id: memberId },
        include: { membership: true }
      });

      if (!member) {
        throw new Error('Member not found');
      }

      // Check if membership plan exists
      const plan = await tx.membershipPlan.findUnique({
        where: { id: planId }
      });
      if (!plan) {
        throw new Error('Selected membership plan not found.');
      }

      // Determine if membership needs updating or creation
      let targetMembershipId = member.membershipId;

      if (!member.membership || member.membership.planId !== planId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.durationDays);

        const newMembership = await tx.membership.create({
          data: {
            planId,
            startDate,
            endDate,
            status: 'ACTIVE'
          }
        });

        await tx.member.update({
          where: { id: memberId },
          data: { membershipId: newMembership.id }
        });

        targetMembershipId = newMembership.id;

        if (member.membership) {
          await tx.membership.update({
            where: { id: member.membership.id },
            data: { status: 'CANCELLED' }
          });
        }
      } else {
        // Activate existing membership if it matches
        await tx.membership.update({
          where: { id: member.membershipId },
          data: { status: 'ACTIVE' }
        });
      }

      // Create Payment entry
      const payment = await tx.payment.create({
        data: {
          memberId,
          invoiceNumber,
          amountPaid: parseFloat(amountPaid),
          totalAmount: parseFloat(totalAmount),
          taxAmount: parseFloat(taxAmount),
          status: 'PAID',
          method,
          notes
        },
        include: {
          member: {
            include: {
              user: {
                select: { email: true }
              },
              membership: {
                include: { plan: true }
              }
            }
          }
        }
      });

      return payment;
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'Member not found' || err.message === 'Selected membership plan not found.') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/payments/ledger
 * Fetch payment ledger with filters and aggregates for Recharts
 */
async function getLedger(req, res, next) {
  try {
    const { startDate, endDate, status, method } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (method && method !== 'ALL') {
      where.method = method;
    }
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    const [transactions, totalCount] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: {
            include: {
              user: {
                select: { email: true }
              },
              membership: {
                include: { plan: true }
              }
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    // Financial summaries
    const allPayments = await prisma.payment.findMany({
      select: {
        amountPaid: true,
        totalAmount: true,
        status: true,
        paymentDate: true
      }
    });

    let totalRevenue = 0;
    let totalPending = 0;
    allPayments.forEach(p => {
      if (p.status === 'PAID' || p.status === 'PARTIAL') {
        totalRevenue += p.amountPaid;
      }
      if (p.status === 'PENDING') {
        totalPending += p.totalAmount;
      } else if (p.status === 'PARTIAL') {
        totalPending += Math.max(0, p.totalAmount - p.amountPaid);
      }
    });

    // Compute monthly trend for the last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const monthlyMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = 0;
    }

    allPayments.forEach(p => {
      if (p.status === 'PAID' || p.status === 'PARTIAL') {
        const d = new Date(p.paymentDate);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += p.amountPaid;
        }
      }
    });

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue
    }));

    res.json({
      transactions,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
      summary: {
        totalRevenue,
        totalPending,
        totalTransactions: allPayments.length
      },
      monthlyRevenue
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/member/:memberId
 * Retrieve payments history for a member
 */
async function getMemberPayments(req, res, next) {
  try {
    const { memberId } = req.params;

    if (req.user.role === 'MEMBER') {
      const member = await prisma.member.findUnique({
        where: { userId: req.user.id }
      });
      if (!member || member.id !== memberId) {
        return res.status(403).json({ error: 'Permission denied. You can only view your own payment records.' });
      }
    }

    const payments = await prisma.payment.findMany({
      where: { memberId },
      include: {
        member: {
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.json(payments);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createInvoice,
  getLedger,
  getMemberPayments
};
