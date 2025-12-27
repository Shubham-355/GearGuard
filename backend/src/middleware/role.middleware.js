const { ROLES } = require('../config/constants');
const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * Check if user is Admin
 */
const isAdmin = authorize(ROLES.ADMIN);

/**
 * Check if user is Admin or Maintenance Manager
 */
const isAdminOrManager = authorize(ROLES.ADMIN, ROLES.MAINTENANCE_MANAGER);

/**
 * Check if user is Admin, Manager, or Technician
 */
const canManageMaintenance = authorize(ROLES.ADMIN, ROLES.MAINTENANCE_MANAGER, ROLES.TECHNICIAN);

/**
 * Check if user belongs to the same company
 */
const sameCompany = (req, res, next) => {
  const resourceCompanyId = req.params.companyId || req.body.companyId;
  
  if (resourceCompanyId && resourceCompanyId !== req.user.companyId) {
    return next(ApiError.forbidden('You can only access resources within your company'));
  }
  
  next();
};

/**
 * Check if user is a team member (for team-specific operations)
 */
const isTeamMember = async (req, res, next) => {
  const teamId = req.params.teamId || req.body.teamId;
  
  if (!teamId) {
    return next();
  }

  // Admins and Managers can access any team
  if ([ROLES.ADMIN, ROLES.MAINTENANCE_MANAGER].includes(req.user.role)) {
    return next();
  }

  const isMember = req.user.teamMemberships?.some(tm => tm.teamId === teamId);
  
  if (!isMember) {
    return next(ApiError.forbidden('You are not a member of this team'));
  }
  
  next();
};

/**
 * Check if user can modify their own data or is admin
 */
const canModifyUser = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;
  
  // Admins can modify anyone
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }
  
  // Managers can modify technicians and employees
  if (req.user.role === ROLES.MAINTENANCE_MANAGER) {
    // Will be checked in the controller
    return next();
  }
  
  // Users can only modify themselves
  if (targetUserId && targetUserId !== req.user.id) {
    return next(ApiError.forbidden('You can only modify your own data'));
  }
  
  next();
};

module.exports = {
  authorize,
  isAdmin,
  isAdminOrManager,
  canManageMaintenance,
  sameCompany,
  isTeamMember,
  canModifyUser,
};
