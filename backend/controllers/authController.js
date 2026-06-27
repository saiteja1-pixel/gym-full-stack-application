const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { token, role, user: { id, email, name } }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        adminProfile: true,
        trainerProfile: true,
        memberProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Build profile based on role
    let profile = null;
    let name = 'User';

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      profile = user.adminProfile;
      name = user.adminProfile?.name || 'Admin';
    } else if (user.role === 'TRAINER') {
      profile = user.trainerProfile;
      name = user.trainerProfile?.name || 'Trainer';
    } else if (user.role === 'MEMBER') {
      profile = user.memberProfile;
      name = user.memberProfile?.name || 'Member';
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      token,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * Response: Full user profile with nested sub-profile
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: true,
        trainerProfile: true,
        memberProfile: {
          include: {
            membership: {
              include: {
                plan: true,
              },
            },
            trainer: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Server error retrieving profile' });
  }
};

/**
 * POST /api/auth/refresh-qr
 * Regenerate member's unique qrCodeToken dynamically.
 */
const refreshQrToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { generateQrToken } = require('../utils/generateQrToken');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberProfile: true },
    });

    if (!user || user.role !== 'MEMBER' || !user.memberProfile) {
      return res.status(404).json({ error: 'Member profile not found.' });
    }

    const newToken = generateQrToken(user.memberProfile.memberId, user.email);

    await prisma.member.update({
      where: { id: user.memberProfile.id },
      data: { qrCodeToken: newToken },
    });

    return res.status(200).json({ qrCodeToken: newToken });
  } catch (error) {
    console.error('Refresh QR Error:', error);
    return res.status(500).json({ error: 'Server error regenerating QR token' });
  }
};

module.exports = { login, getMe, refreshQrToken };
