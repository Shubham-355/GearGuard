const { body, param, query } = require('express-validator');
const { EQUIPMENT_STATUS } = require('../config/constants');

const equipmentValidators = {
  // Create equipment
  createEquipment: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Equipment name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Equipment name must be between 2 and 200 characters'),
    body('serialNumber')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Serial number must be less than 100 characters'),
    body('model')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Model must be less than 100 characters'),
    body('purchaseDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid purchase date format'),
    body('warrantyExpiry')
      .optional()
      .isISO8601()
      .withMessage('Invalid warranty expiry date format'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Location must be less than 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('healthPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Health percentage must be between 0 and 100'),
    body('categoryId')
      .optional()
      .isUUID()
      .withMessage('Invalid category ID'),
    body('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
    body('ownerId')
      .optional()
      .isUUID()
      .withMessage('Invalid owner ID'),
    body('technicianId')
      .optional()
      .isUUID()
      .withMessage('Invalid technician ID'),
    body('maintenanceTeamId')
      .optional()
      .isUUID()
      .withMessage('Invalid maintenance team ID'),
    body('workCenterId')
      .optional()
      .isUUID()
      .withMessage('Invalid work center ID'),
  ],

  // Update equipment
  updateEquipment: [
    param('id')
      .isUUID()
      .withMessage('Invalid equipment ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Equipment name must be between 2 and 200 characters'),
    body('serialNumber')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Serial number must be less than 100 characters'),
    body('model')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Model must be less than 100 characters'),
    body('purchaseDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid purchase date format'),
    body('warrantyExpiry')
      .optional()
      .isISO8601()
      .withMessage('Invalid warranty expiry date format'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Location must be less than 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('healthPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Health percentage must be between 0 and 100'),
    body('status')
      .optional()
      .isIn(Object.values(EQUIPMENT_STATUS))
      .withMessage(`Status must be one of: ${Object.values(EQUIPMENT_STATUS).join(', ')}`),
    body('categoryId')
      .optional()
      .isUUID()
      .withMessage('Invalid category ID'),
    body('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
    body('ownerId')
      .optional()
      .isUUID()
      .withMessage('Invalid owner ID'),
    body('technicianId')
      .optional()
      .isUUID()
      .withMessage('Invalid technician ID'),
    body('maintenanceTeamId')
      .optional()
      .isUUID()
      .withMessage('Invalid maintenance team ID'),
    body('workCenterId')
      .optional()
      .isUUID()
      .withMessage('Invalid work center ID'),
  ],

  // Get equipment by ID
  getEquipmentById: [
    param('id')
      .isUUID()
      .withMessage('Invalid equipment ID'),
  ],

  // List equipment
  listEquipment: [
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
    query('status')
      .optional()
      .isIn(Object.values(EQUIPMENT_STATUS))
      .withMessage(`Status must be one of: ${Object.values(EQUIPMENT_STATUS).join(', ')}`),
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('Invalid category ID'),
    query('departmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid department ID'),
    query('ownerId')
      .optional()
      .isUUID()
      .withMessage('Invalid owner ID'),
    query('teamId')
      .optional()
      .isUUID()
      .withMessage('Invalid team ID'),
    query('healthBelow')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Health threshold must be between 0 and 100'),
  ],

  // Scrap equipment
  scrapEquipment: [
    param('id')
      .isUUID()
      .withMessage('Invalid equipment ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
  ],
};

module.exports = equipmentValidators;
