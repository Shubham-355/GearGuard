const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const departmentValidators = require('../validators/department.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.post(
  '/',
  isAdminOrManager,
  departmentValidators.createDepartment,
  validate,
  departmentController.createDepartment
);

router.get(
  '/',
  departmentValidators.listDepartments,
  validate,
  departmentController.getDepartments
);

router.get(
  '/:id',
  departmentValidators.getDepartmentById,
  validate,
  departmentController.getDepartmentById
);

router.put(
  '/:id',
  isAdminOrManager,
  departmentValidators.updateDepartment,
  validate,
  departmentController.updateDepartment
);

router.delete(
  '/:id',
  isAdminOrManager,
  departmentValidators.getDepartmentById,
  validate,
  departmentController.deleteDepartment
);

module.exports = router;
