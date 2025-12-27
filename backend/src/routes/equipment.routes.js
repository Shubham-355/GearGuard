const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const equipmentValidators = require('../validators/equipment.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager, canManageMaintenance } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Get critical equipment
router.get('/critical', equipmentController.getCriticalEquipment);

// Get equipment stats
router.get('/stats', equipmentController.getEquipmentStats);

// CRUD routes
router.post(
  '/',
  isAdminOrManager,
  equipmentValidators.createEquipment,
  validate,
  equipmentController.createEquipment
);

router.get(
  '/',
  equipmentValidators.listEquipment,
  validate,
  equipmentController.getEquipment
);

router.get(
  '/:id',
  equipmentValidators.getEquipmentById,
  validate,
  equipmentController.getEquipmentById
);

router.put(
  '/:id',
  isAdminOrManager,
  equipmentValidators.updateEquipment,
  validate,
  equipmentController.updateEquipment
);

router.delete(
  '/:id',
  isAdminOrManager,
  equipmentValidators.getEquipmentById,
  validate,
  equipmentController.deleteEquipment
);

// Scrap equipment
router.post(
  '/:id/scrap',
  isAdminOrManager,
  equipmentValidators.scrapEquipment,
  validate,
  equipmentController.scrapEquipment
);

// Get maintenance requests for equipment (Smart Button)
router.get(
  '/:id/requests',
  equipmentValidators.getEquipmentById,
  validate,
  equipmentController.getEquipmentRequests
);

module.exports = router;
