const { body, param, query } = require('express-validator');

const categoryValidators = {
  // Create category
  createCategory: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('responsibleDeptId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
  ],

  // Update category
  updateCategory: [
    param('id')
      .isUUID()
      .withMessage('Invalid category ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('responsibleDeptId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
  ],

  // Get category by ID
  getCategoryById: [
    param('id')
      .isUUID()
      .withMessage('Invalid category ID'),
  ],

  // List categories
  listCategories: [
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

module.exports = categoryValidators;
