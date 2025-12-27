const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidators = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// Public routes
router.post(
  '/register-company',
  authValidators.registerCompany,
  validate,
  authController.registerCompany
);

router.post(
  '/signup',
  authValidators.signup,
  validate,
  authController.signup
);

router.post(
  '/signup-with-invite',
  authValidators.signupWithInvite,
  validate,
  authController.signupWithInvite
);

router.post(
  '/login',
  authValidators.login,
  validate,
  authController.login
);

// Protected routes
router.get('/me', authenticate, authController.getMe);

router.put(
  '/change-password',
  authenticate,
  authValidators.changePassword,
  validate,
  authController.changePassword
);

router.put('/profile', authenticate, authController.updateProfile);

// Admin only routes
router.get('/invite-code', authenticate, isAdmin, authController.getInviteCode);
router.post('/regenerate-invite', authenticate, isAdmin, authController.regenerateInviteCode);

module.exports = router;
