const crypto = require('crypto');
const { PASSWORD_REQUIREMENTS } = require('../config/constants');

/**
 * Generate a unique invite code for company
 * Format: GG-{COMPANY_PREFIX}-{RANDOM}
 */
const generateInviteCode = (companyName) => {
  const prefix = companyName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const random = crypto.randomInt(1000, 9999);
  return `GG-${prefix}-${random}`;
};

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, special char
 */
const validatePassword = (password) => {
  const errors = [];

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`);
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL) {
    const specialRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Extract domain from email
 */
const extractEmailDomain = (email) => {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return null;
  return email.substring(atIndex).toLowerCase();
};

/**
 * Check if email domain matches allowed domains
 */
const isDomainAllowed = (email, allowedDomains) => {
  const domain = extractEmailDomain(email);
  if (!domain) return false;
  return allowedDomains.some(allowed => 
    domain.toLowerCase() === allowed.toLowerCase()
  );
};

/**
 * Calculate pagination offset
 */
const getPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset,
  };
};

/**
 * Format pagination response
 */
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Check if a date is overdue
 */
const isOverdue = (scheduledDate) => {
  if (!scheduledDate) return false;
  return new Date(scheduledDate) < new Date();
};

/**
 * Calculate duration in hours between two dates
 */
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate) - new Date(startDate);
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
};

/**
 * Sanitize string for search
 */
const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.trim().replace(/[%_]/g, '\\$&');
};

module.exports = {
  generateInviteCode,
  validatePassword,
  extractEmailDomain,
  isDomainAllowed,
  getPagination,
  formatPaginationResponse,
  isOverdue,
  calculateDuration,
  sanitizeSearchQuery,
};
