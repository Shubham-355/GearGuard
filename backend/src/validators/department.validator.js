const { body, param, query } = require('express-validator');

const departmentValidators = {
  // Create department
  createDepartment: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Department name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],

  // Update department
  updateDepartment: [
    param('id')
      .isUUID()
      .withMessage('Invalid department ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],

  // Get department by ID
  getDepartmentById: [
    param('id')
      .isUUID()
      .withMessage('Invalid department ID'),
  ],

  // List departments
  listDepartments: [
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
  ],
};

module.exports = departmentValidators;
