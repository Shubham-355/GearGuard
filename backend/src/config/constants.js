module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 'ADMIN',
    MAINTENANCE_MANAGER: 'MAINTENANCE_MANAGER',
    TECHNICIAN: 'TECHNICIAN',
    EMPLOYEE: 'EMPLOYEE',
  },

  // Request Types
  REQUEST_TYPES: {
    CORRECTIVE: 'CORRECTIVE',
    PREVENTIVE: 'PREVENTIVE',
  },

  // Request Stages
  REQUEST_STAGES: {
    NEW: 'NEW',
    IN_PROGRESS: 'IN_PROGRESS',
    REPAIRED: 'REPAIRED',
    SCRAP: 'SCRAP',
  },

  // Priority Levels
  PRIORITIES: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },

  // Equipment Status
  EQUIPMENT_STATUS: {
    ACTIVE: 'ACTIVE',
    UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
    SCRAPPED: 'SCRAPPED',
  },

  // Health Thresholds
  HEALTH_THRESHOLDS: {
    CRITICAL: 30,  // Below 30% is critical
    WARNING: 50,   // Below 50% is warning
  },

  // Password Requirements
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },

  // JWT Configuration
  JWT: {
    EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};
