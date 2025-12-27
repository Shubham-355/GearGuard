const express = require('express');
const router = express.Router();
const workCenterController = require('../controllers/workCenter.controller');
const workCenterValidators = require('../validators/workCenter.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Get work center stats
router.get('/stats', workCenterController.getWorkCenterStats);

// CRUD routes
router.post(
  '/',
  isAdminOrManager,
  workCenterValidators.createWorkCenter,
  validate,
  workCenterController.createWorkCenter
);

router.get(
  '/',
  workCenterValidators.listWorkCenters,
  validate,
  workCenterController.getWorkCenters
);

router.get(
  '/:id',
  workCenterValidators.getWorkCenterById,
  validate,
  workCenterController.getWorkCenterById
);

router.put(
  '/:id',
  isAdminOrManager,
  workCenterValidators.updateWorkCenter,
  validate,
  workCenterController.updateWorkCenter
);

router.delete(
  '/:id',
  isAdminOrManager,
  workCenterValidators.getWorkCenterById,
  validate,
  workCenterController.deleteWorkCenter
);

module.exports = router;
