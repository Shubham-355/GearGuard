const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const categoryValidators = require('../validators/category.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.post(
  '/',
  isAdminOrManager,
  categoryValidators.createCategory,
  validate,
  categoryController.createCategory
);

router.get(
  '/',
  categoryValidators.listCategories,
  validate,
  categoryController.getCategories
);

router.get(
  '/:id',
  categoryValidators.getCategoryById,
  validate,
  categoryController.getCategoryById
);

router.put(
  '/:id',
  isAdminOrManager,
  categoryValidators.updateCategory,
  validate,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  isAdminOrManager,
  categoryValidators.getCategoryById,
  validate,
  categoryController.deleteCategory
);

module.exports = router;
