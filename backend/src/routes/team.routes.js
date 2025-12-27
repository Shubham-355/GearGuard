const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const teamValidators = require('../validators/team.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Get team stats
router.get('/stats', teamController.getTeamStats);

// CRUD routes
router.post(
  '/',
  isAdminOrManager,
  teamValidators.createTeam,
  validate,
  teamController.createTeam
);

router.get(
  '/',
  teamValidators.listTeams,
  validate,
  teamController.getTeams
);

router.get(
  '/:id',
  teamValidators.getTeamById,
  validate,
  teamController.getTeamById
);

router.put(
  '/:id',
  isAdminOrManager,
  teamValidators.updateTeam,
  validate,
  teamController.updateTeam
);

router.delete(
  '/:id',
  isAdminOrManager,
  teamValidators.getTeamById,
  validate,
  teamController.deleteTeam
);

// Team members
router.get(
  '/:id/members',
  teamValidators.getTeamById,
  validate,
  teamController.getTeamMembers
);

router.post(
  '/:id/members',
  isAdminOrManager,
  teamValidators.addMember,
  validate,
  teamController.addMember
);

router.delete(
  '/:id/members/:userId',
  isAdminOrManager,
  teamValidators.removeMember,
  validate,
  teamController.removeMember
);

router.patch(
  '/:id/members/:userId',
  isAdminOrManager,
  teamValidators.updateMember,
  validate,
  teamController.updateMember
);

module.exports = router;
