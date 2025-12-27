const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const requestValidators = require('../validators/request.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager, canManageMaintenance } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Special views
router.get('/kanban', requestController.getKanbanRequests);

router.get(
  '/calendar',
  requestValidators.calendarRequests,
  validate,
  requestController.getCalendarRequests
);

router.get('/stats', requestController.getRequestStats);

// CRUD routes
router.post(
  '/',
  requestValidators.createRequest,
  validate,
  requestController.createRequest
);

router.get(
  '/',
  requestValidators.listRequests,
  validate,
  requestController.getRequests
);

router.get(
  '/:id',
  requestValidators.getRequestById,
  validate,
  requestController.getRequestById
);

router.put(
  '/:id',
  canManageMaintenance,
  requestValidators.updateRequest,
  validate,
  requestController.updateRequest
);

router.delete(
  '/:id',
  requestValidators.getRequestById,
  validate,
  requestController.deleteRequest
);

// Stage update (for Kanban drag-drop)
router.patch(
  '/:id/stage',
  canManageMaintenance,
  requestValidators.updateStage,
  validate,
  requestController.updateStage
);

// Assign technician
router.patch(
  '/:id/assign',
  isAdminOrManager,
  requestValidators.assignTechnician,
  validate,
  requestController.assignTechnician
);

// Self-assign (for technicians)
router.patch(
  '/:id/self-assign',
  canManageMaintenance,
  requestValidators.getRequestById,
  validate,
  requestController.selfAssign
);

module.exports = router;
