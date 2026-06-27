const crypto = require('crypto');

/**
 * Generates a cryptographically secure HMAC-SHA256 QR token for a member.
 * @param {string} memberId - The member's unique human-readable ID (e.g. CF-2026-0001)
 * @param {string} email - The member's email address
 * @returns {string} - 64-character hex token
 */
function generateQrToken(memberId, email) {
  const salt = process.env.QR_SECRET_SALT || 'corefit_secure_salt_change_in_production';
  return crypto
    .createHmac('sha256', salt)
    .update(`${memberId}-${email}-${Date.now()}`)
    .digest('hex');
}

module.exports = { generateQrToken };
