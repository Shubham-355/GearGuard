const { body, param, query } = require('express-validator');
const { REQUEST_TYPES, REQUEST_STAGES, PRIORITIES } = require('../config/constants');

const requestValidators = {
  // Create maintenance request
  createRequest: [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Subject must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('requestType')
      .optional()
      .isIn(Object.values(REQUEST_TYPES))
      .withMessage(`Request type must be one of: ${Object.values(REQUEST_TYPES).join(', ')}`),
    body('priority')
      .optional()
      .isIn(Object.values(PRIORITIES))
      .withMessage(`Priority must be one of: ${Object.values(PRIORITIES).join(', ')}`),
    body('equipmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid equipment ID'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled date format'),
    body('technicianId')
      .optional()
      .isUUID()
      .withMessage('Invalid technician ID'),
    body('teamId')
      .optional()
      .isUUID()
      .withMessage('Invalid team ID'),
  ],

  // Update maintenance request
  updateRequest: [
    param('id')
      .isUUID()
      .withMessage('Invalid request ID'),
    body('subject')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Subject must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('requestType')
      .optional()
      .isIn(Object.values(REQUEST_TYPES))
      .withMessage(`Request type must be one of: ${Object.values(REQUEST_TYPES).join(', ')}`),
    body('priority')
      .optional()
      .isIn(Object.values(PRIORITIES))
      .withMessage(`Priority must be one of: ${Object.values(PRIORITIES).join(', ')}`),
    body('stage')
      .optional()
      .isIn(Object.values(REQUEST_STAGES))
      .withMessage(`Stage must be one of: ${Object.values(REQUEST_STAGES).join(', ')}`),
    body('equipmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid equipment ID'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled date format'),
    body('technicianId')
      .optional()
      .isUUID()
      .withMessage('Invalid technician ID'),
    body('teamId')
      .optional()
      .isUUID()
      .withMessage('Invalid team ID'),
    body('duration')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Duration must be a positive number'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes must be less than 2000 characters'),
  ],

  // Update request stage
  updateStage: [
    param('id')
      .isUUID()
      .withMessage('Invalid request ID'),
    body('stage')
      .notEmpty()
      .withMessage('Stage is required')
      .isIn(Object.values(REQUEST_STAGES))
      .withMessage(`Stage must be one of: ${Object.values(REQUEST_STAGES).join(', ')}`),
    body('duration')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Duration must be a positive number'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes must be less than 2000 characters'),
  ],

  // Assign technician
  assignTechnician: [
    param('id')
      .isUUID()
      .withMessage('Invalid request ID'),
    body('technicianId')
      .notEmpty()
      .withMessage('Technician ID is required')
      .isUUID()
      .withMessage('Invalid technician ID'),
  ],

  // Get request by ID
  getRequestById: [
    param('id')
      .isUUID()
      .withMessage('Invalid request ID'),
  ],

  // List requests
  listRequests: [
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
    query('stage')
      .optional()
      .isIn(Object.values(REQUEST_STAGES))
      .withMessage(`Stage must be one of: ${Object.values(REQUEST_STAGES).join(', ')}`),
    query('requestType')
      .optional()
      .isIn(Object.values(REQUEST_TYPES))
      .withMessage(`Request type must be one of: ${Object.values(REQUEST_TYPES).join(', ')}`),
    query('priority')
      .optional()
      .isIn(Object.values(PRIORITIES))
      .withMessage(`Priority must be one of: ${Object.values(PRIORITIES).join(', ')}`),
    query('equipmentId')
      .optional()
      .isUUID()
      .withMessage('Invalid equipment ID'),
    query('teamId')
      .optional()
      .isUUID()
      .withMessage('Invalid team ID'),
    query('technicianId')
      .optional()
      .isUUID()
      .withMessage('Invalid technician ID'),
    query('createdById')
      .optional()
      .isUUID()
      .withMessage('Invalid creator ID'),
    query('isOverdue')
      .optional()
      .isBoolean()
      .withMessage('isOverdue must be a boolean'),
    query('fromDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid from date format'),
    query('toDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid to date format'),
  ],

  // Calendar view requests
  calendarRequests: [
    query('startDate')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('requestType')
      .optional()
      .isIn(Object.values(REQUEST_TYPES))
      .withMessage(`Request type must be one of: ${Object.values(REQUEST_TYPES).join(', ')}`),
    query('teamId')
      .optional()
      .isUUID()
      .withMessage('Invalid team ID'),
  ],
};

module.exports = requestValidators;
