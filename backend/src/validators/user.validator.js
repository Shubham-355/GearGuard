const { body, param, query } = require('express-validator');
const { ROLES } = require('../config/constants');

const userValidators = {
  // Create user (by Admin)
  createUser: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .optional()
      .isIn(Object.values(ROLES))
      .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
    body('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
  ],

  // Update user
  updateUser: [
    param('id')
      .isUUID()
      .withMessage('Invalid user ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(Object.values(ROLES))
      .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
    body('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  // Get user by ID
  getUserById: [
    param('id')
      .isUUID()
      .withMessage('Invalid user ID'),
  ],

  // List users
  listUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(Object.values(ROLES))
      .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search query too long'),
    query('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
  ],
};

module.exports = userValidators;
