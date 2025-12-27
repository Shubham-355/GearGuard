const { body, param, query } = require('express-validator');

const workCenterValidators = {
  // Create work center
  createWorkCenter: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Work center name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Work center name must be between 2 and 100 characters'),
    body('code')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Code must be less than 50 characters'),
    body('tag')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Tag must be less than 50 characters'),
    body('costPerHour')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost per hour must be a positive number'),
    body('capacityTimeEfficiency')
      .optional()
      .isFloat({ min: 0, max: 200 })
      .withMessage('Capacity time efficiency must be between 0 and 200'),
    body('oeeTarget')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('OEE target must be between 0 and 100'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('alternativeWorkCenterId')
      .optional()
      .isUUID()
      .withMessage('Invalid alternative work center ID'),
  ],

  // Update work center
  updateWorkCenter: [
    param('id')
      .isUUID()
      .withMessage('Invalid work center ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Work center name must be between 2 and 100 characters'),
    body('code')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Code must be less than 50 characters'),
    body('tag')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Tag must be less than 50 characters'),
    body('costPerHour')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost per hour must be a positive number'),
    body('capacityTimeEfficiency')
      .optional()
      .isFloat({ min: 0, max: 200 })
      .withMessage('Capacity time efficiency must be between 0 and 200'),
    body('oeeTarget')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('OEE target must be between 0 and 100'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('alternativeWorkCenterId')
      .optional()
      .isUUID()
      .withMessage('Invalid alternative work center ID'),
  ],

  // Get work center by ID
  getWorkCenterById: [
    param('id')
      .isUUID()
      .withMessage('Invalid work center ID'),
  ],

  // List work centers
  listWorkCenters: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search query too long'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
};

module.exports = workCenterValidators;
