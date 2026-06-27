const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { generateQrToken } = require('../utils/generateQrToken');

// ─── Membership Plan Controllers ─────────────────────────────────────────────

/**
 * POST /api/admin/membership-plans
 * Create a new membership plan
 */
async function createPlan(req, res, next) {
  try {
    const {
      name,
      price,
      duration,
      durationDays,
      joiningFee,
      gstPercent,
      freezeDays,
      description
    } = req.body;

    if (!name || price === undefined || !duration || !durationDays) {
      return res.status(400).json({ error: 'Name, price, duration, and durationDays are required.' });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price: parseFloat(price),
        duration,
        durationDays: parseInt(durationDays, 10),
        joiningFee: joiningFee !== undefined ? parseFloat(joiningFee) : 0,
        gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : 18.0,
        freezeDays: freezeDays !== undefined ? parseInt(freezeDays, 10) : 0,
        description,
        isActive: true
      }
    });

    res.status(201).json(plan);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A plan with this name already exists.' });
    }
    next(err);
  }
}

/**
 * GET /api/admin/membership-plans
 * List all active/inactive membership plans (MEMBER selection only fetches active plans)
 */
async function listPlans(req, res, next) {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/membership-plans/:id
 * Update a plan
 */
async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      duration,
      durationDays,
      joiningFee,
      gstPercent,
      freezeDays,
      description,
      isActive
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = parseFloat(price);
    if (duration !== undefined) data.duration = duration;
    if (durationDays !== undefined) data.durationDays = parseInt(durationDays, 10);
    if (joiningFee !== undefined) data.joiningFee = parseFloat(joiningFee);
    if (gstPercent !== undefined) data.gstPercent = parseFloat(gstPercent);
    if (freezeDays !== undefined) data.freezeDays = parseInt(freezeDays, 10);
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = !!isActive;

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data
    });

    res.json(plan);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Plan not found.' });
    }
    next(err);
  }
}

/**
 * DELETE /api/admin/membership-plans/:id
 * Soft-delete (set isActive = false)
 */
async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Plan deactivated successfully.', plan });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Plan not found.' });
    }
    next(err);
  }
}

// ─── Trainer Dropdown API ──────────────────────────────────────────────────

/**
 * GET /api/admin/trainers
 * List all active trainers for profile assignment
 */
async function listTrainers(req, res, next) {
  try {
    const trainers = await prisma.trainer.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(trainers);
  } catch (err) {
    next(err);
  }
}

// ─── Member Controllers ──────────────────────────────────────────────────────

/**
 * POST /api/admin/members
 * Register a member using a secure atomic Prisma Transaction
 */
async function registerMember(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      dob,
      gender,
      emergencyContact,
      initialHeight,
      initialWeight,
      trainerId,
      planId,
      avatarUrl,
      idProofUrl
    } = req.body;

    // Check email uniqueness first
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Check membership plan
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive membership plan selected.' });
    }

    // Check trainer assignment if provided
    if (trainerId) {
      const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
      if (!trainer) {
        return res.status(400).json({ error: 'Trainer not found.' });
      }
    }

    // Generate unique sequential member ID (CF-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const prefix = `CF-${currentYear}-`;
    const latestMember = await prisma.member.findFirst({
      where: { memberId: { startsWith: prefix } },
      orderBy: { memberId: 'desc' }
    });

    let nextNum = 1;
    if (latestMember) {
      const parts = latestMember.memberId.split('-');
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const memberId = `${prefix}${String(nextNum).padStart(4, '0')}`;

    // Cryptographic QR token
    const qrCodeToken = generateQrToken(memberId, email);

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // Hash default password: CoreFit2026!
    const defaultPassword = 'CoreFit2026!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'MEMBER'
        }
      });

      // 2. Create Membership
      const membership = await tx.membership.create({
        data: {
          planId: plan.id,
          startDate,
          endDate,
          status: 'ACTIVE'
        }
      });

      // 3. Create Member
      const member = await tx.member.create({
        data: {
          userId: user.id,
          memberId,
          name,
          phone,
          dob: new Date(dob),
          gender,
          emergencyContact,
          avatarUrl,
          idProofUrl,
          qrCodeToken,
          initialHeight: parseFloat(initialHeight),
          initialWeight: parseFloat(initialWeight),
          trainerId: trainerId || null,
          membershipId: membership.id
        }
      });

      return { user, member, membership };
    });

    res.status(201).json({
      success: true,
      member: {
        id: result.member.id,
        memberId: result.member.memberId,
        name: result.member.name,
        qrCodeToken: result.member.qrCodeToken
      }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/members
 * Paginated list of members with search (name/phone/email) and status filters
 */
async function listMembers(req, res, next) {
  try {
    const search = req.query.search || '';
    const status = req.query.status || 'ALL';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { memberId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply status filter
    if (status !== 'ALL') {
      where.membership = { status: status };
    }

    const [members, totalCount] = await prisma.$transaction([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        include: {
          membership: {
            include: { plan: true }
          },
          trainer: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.member.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      members,
      totalPages,
      currentPage: page,
      totalCount
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/members/:id
 * Get full member details
 */
async function getMemberDetails(req, res, next) {
  try {
    const { id } = req.params;

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { id },
          { memberId: id }
        ]
      },
      include: {
        user: {
          select: { email: true, role: true }
        },
        membership: {
          include: { plan: true }
        },
        trainer: true,
        bodyMeasurements: {
          orderBy: { logDate: 'desc' },
          take: 5
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 3
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json(member);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/members/:id
 * Update member profile fields
 */
async function updateMember(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      dob,
      gender,
      emergencyContact,
      trainerId,
      avatarUrl,
      idProofUrl
    } = req.body;

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { id },
          { memberId: id }
        ]
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (dob !== undefined) data.dob = new Date(dob);
    if (gender !== undefined) data.gender = gender;
    if (emergencyContact !== undefined) data.emergencyContact = emergencyContact;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (idProofUrl !== undefined) data.idProofUrl = idProofUrl;
    if (trainerId !== undefined) data.trainerId = trainerId || null;

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data,
      include: {
        membership: { include: { plan: true } },
        trainer: true
      }
    });

    res.json(updatedMember);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/members/:id/freeze
 * Freeze a membership
 */
async function freezeMember(req, res, next) {
  try {
    const { id } = req.params;
    const { freezeDays } = req.body;

    if (!freezeDays || parseInt(freezeDays, 10) <= 0) {
      return res.status(400).json({ error: 'Valid freezeDays parameter is required.' });
    }

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { id },
          { memberId: id }
        ]
      },
      include: { membership: true }
    });

    if (!member || !member.membership) {
      return res.status(404).json({ error: 'Active membership not found for this member.' });
    }

    const membership = member.membership;

    // Calculate dates
    const freezeStart = new Date();
    const freezeEnd = new Date();
    freezeEnd.setDate(freezeStart.getDate() + parseInt(freezeDays, 10));

    // Extend original endDate by freezeDays
    const originalEndDate = new Date(membership.endDate);
    originalEndDate.setDate(originalEndDate.getDate() + parseInt(freezeDays, 10));

    const updatedMembership = await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'FROZEN',
        freezeStart,
        freezeEnd,
        endDate: originalEndDate,
        remainingFreezeDays: {
          decrement: parseInt(freezeDays, 10)
        }
      }
    });

    res.json({
      success: true,
      message: `Membership successfully frozen for ${freezeDays} days.`,
      membership: updatedMembership
    });

  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/members/:id/renew
 * Renew membership with a new plan selection
 */
async function renewMember(req, res, next) {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'planId parameter is required.' });
    }

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { id },
          { memberId: id }
        ]
      },
      include: { membership: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive membership plan selected.' });
    }

    // Start date calculation: If active membership exists and has not expired, start date is its endDate, otherwise today.
    let startDate = new Date();
    if (member.membership && new Date(member.membership.endDate) > new Date()) {
      startDate = new Date(member.membership.endDate);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const result = await prisma.$transaction(async (tx) => {
      // Create new membership record
      const membership = await tx.membership.create({
        data: {
          planId: plan.id,
          startDate,
          endDate,
          status: 'ACTIVE'
        }
      });

      // Update Member with new membershipId
      const updatedMember = await tx.member.update({
        where: { id: member.id },
        data: {
          membershipId: membership.id
        }
      });

      // Optionally, if they had an old membership, we can archive or mark it cancelled
      if (member.membership) {
        await tx.membership.update({
          where: { id: member.membership.id },
          data: { status: 'CANCELLED' }
        });
      }

      return { membership, updatedMember };
    });

    res.json({
      success: true,
      message: 'Membership successfully renewed.',
      membership: result.membership
    });

  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard-stats
 * Fetch dashboard stats for administrative analytics
 */
async function getDashboardStats(req, res, next) {
  try {
    const today = new Date();
    
    // Start and end of today
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 7 days later
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Start and end of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Total Members
    const totalMembers = await prisma.member.count();

    // 2. Active Members
    const activeMembers = await prisma.member.count({
      where: {
        membership: { status: 'ACTIVE' }
      }
    });

    // 3. Expired Members
    const expiredMembers = await prisma.member.count({
      where: {
        membership: { status: 'EXPIRED' }
      }
    });

    // 4. Frozen Members
    const frozenMembers = await prisma.member.count({
      where: {
        membership: { status: 'FROZEN' }
      }
    });

    // 5. Upcoming Renewals (next 7 days)
    const upcomingRenewals = await prisma.member.count({
      where: {
        membership: {
          status: 'ACTIVE',
          endDate: {
            gte: today,
            lte: sevenDaysLater
          }
        }
      }
    });

    // 6. Today's Check-ins
    const todayCheckIns = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    // 7. Monthly Revenue & Pending Payments
    const payments = await prisma.payment.findMany({
      select: {
        amountPaid: true,
        totalAmount: true,
        status: true,
        paymentDate: true
      }
    });

    let monthlyRevenue = 0;
    let pendingPayments = 0;

    payments.forEach(p => {
      // Monthly revenue (sum amountPaid for payments made this month)
      if (p.paymentDate >= startOfMonth && p.paymentDate <= endOfMonth) {
        if (p.status === 'PAID' || p.status === 'PARTIAL') {
          monthlyRevenue += p.amountPaid;
        }
      }
      
      // Pending payments sum
      if (p.status === 'PENDING') {
        pendingPayments += p.totalAmount;
      } else if (p.status === 'PARTIAL') {
        pendingPayments += Math.max(0, p.totalAmount - p.amountPaid);
      }
    });

    // 8. Recharts Revenue Trend (last 6 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = 0;
    }

    payments.forEach(p => {
      if (p.status === 'PAID' || p.status === 'PARTIAL') {
        const d = new Date(p.paymentDate);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += p.amountPaid;
        }
      }
    });

    const monthlyRevenueTrend = Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue
    }));

    // 9. Membership distribution chart data
    const membershipDistribution = [
      { name: 'Active', value: activeMembers },
      { name: 'Expired', value: expiredMembers },
      { name: 'Frozen', value: frozenMembers }
    ];

    // 10. Recent Activity Feed (Registrations, check-ins, payments)
    const [latestMembers, latestCheckIns, latestPayments] = await Promise.all([
      prisma.member.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.attendance.findMany({
        take: 10,
        orderBy: { checkInTime: 'desc' },
        include: { member: true }
      }),
      prisma.payment.findMany({
        take: 10,
        orderBy: { paymentDate: 'desc' },
        include: { member: true }
      })
    ]);

    const activities = [];

    latestMembers.forEach(m => {
      activities.push({
        id: `reg-${m.id}`,
        type: 'REGISTRATION',
        title: 'New Member Registered',
        description: `${m.name} (${m.memberId}) registered.`,
        date: m.createdAt
      });
    });

    latestCheckIns.forEach(c => {
      activities.push({
        id: `scan-${c.id}`,
        type: 'CHECK_IN',
        title: 'Member Checked In',
        description: `${c.member?.name || 'Unknown Member'} checked in.`,
        date: c.checkInTime
      });
    });

    latestPayments.forEach(p => {
      activities.push({
        id: `pay-${p.id}`,
        type: 'PAYMENT',
        title: 'Payment Recorded',
        description: `₹${p.amountPaid} received for invoice ${p.invoiceNumber} (${p.member?.name}).`,
        date: p.paymentDate
      });
    });

    // Sort combined activities by date descending, take top 10
    const recentActivity = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      stats: {
        totalMembers,
        activeMembers,
        expiredMembers,
        frozenMembers,
        upcomingRenewals,
        todayCheckIns,
        monthlyRevenue,
        pendingPayments
      },
      monthlyRevenueTrend,
      membershipDistribution,
      recentActivity
    });

  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/trainers
 * Register a new trainer (ADMIN/SUPER_ADMIN only)
 */
async function registerTrainer(req, res, next) {
  try {
    const { email, password, name, phone, specialty, bio } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: 'Email, password, name, and phone are required.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'TRAINER'
        }
      });

      const trainer = await tx.trainer.create({
        data: {
          userId: user.id,
          name,
          phone,
          specialty: specialty || null,
          bio: bio || null
        }
      });

      return trainer;
    });

    res.status(201).json({
      success: true,
      trainer: {
        id: result.id,
        name: result.name,
        phone: result.phone,
        specialty: result.specialty
      }
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPlan,
  listPlans,
  updatePlan,
  deletePlan,
  listTrainers,
  registerMember,
  listMembers,
  getMemberDetails,
  updateMember,
  freezeMember,
  renewMember,
  getDashboardStats,
  registerTrainer
};
