const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userValidators = require('../validators/user.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager, canModifyUser } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Get technicians (accessible by all authenticated users)
router.get('/technicians', userController.getTechnicians);

// Get user stats (admin/manager only)
router.get('/stats', isAdminOrManager, userController.getUserStats);

// CRUD routes
router.post(
  '/',
  isAdminOrManager,
  userValidators.createUser,
  validate,
  userController.createUser
);

router.get(
  '/',
  isAdminOrManager,
  userValidators.listUsers,
  validate,
  userController.getUsers
);

router.get(
  '/:id',
  userValidators.getUserById,
  validate,
  userController.getUserById
);

router.put(
  '/:id',
  canModifyUser,
  userValidators.updateUser,
  validate,
  userController.updateUser
);

router.delete(
  '/:id',
  isAdminOrManager,
  userValidators.getUserById,
  validate,
  userController.deleteUser
);

module.exports = router;
