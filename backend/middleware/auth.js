const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches decoded payload to req.user = { id, email, role }
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid or malformed token' });
  }
};

/**
 * Middleware: Restrict access to specific roles.
 * @param {string[]} allowedRoles - Array of roles that can access the route.
 * Usage: router.get('/protected', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), handler)
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permission denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { authenticateJWT, requireRole };
