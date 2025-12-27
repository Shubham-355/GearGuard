const { body, param, query } = require('express-validator');

const teamValidators = {
  // Create team
  createTeam: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Team name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Team name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],

  // Update team
  updateTeam: [
    param('id')
      .isUUID()
      .withMessage('Invalid team ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Team name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],

  // Get team by ID
  getTeamById: [
    param('id')
      .isUUID()
      .withMessage('Invalid team ID'),
  ],

  // List teams
  listTeams: [
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

  // Add member
  addMember: [
    param('id')
      .isUUID()
      .withMessage('Invalid team ID'),
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isUUID()
      .withMessage('Invalid user ID'),
    body('isLead')
      .optional()
      .isBoolean()
      .withMessage('isLead must be a boolean'),
  ],

  // Remove member
  removeMember: [
    param('id')
      .isUUID()
      .withMessage('Invalid team ID'),
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID'),
  ],

  // Update member role
  updateMember: [
    param('id')
      .isUUID()
      .withMessage('Invalid team ID'),
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID'),
    body('isLead')
      .notEmpty()
      .withMessage('isLead is required')
      .isBoolean()
      .withMessage('isLead must be a boolean'),
  ],
};

module.exports = teamValidators;
