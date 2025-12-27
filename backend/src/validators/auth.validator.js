const { body, param, query } = require('express-validator');
const { validatePassword } = require('../utils/helpers');

const authValidators = {
  // Company Registration
  registerCompany: [
    body('companyName')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    body('allowedDomains')
      .isArray({ min: 1 })
      .withMessage('At least one allowed domain is required'),
    body('allowedDomains.*')
      .trim()
      .matches(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .withMessage('Each domain must be in format @domain.com'),
    body('adminName')
      .trim()
      .notEmpty()
      .withMessage('Admin name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Admin name must be between 2 and 100 characters'),
    body('adminEmail')
      .trim()
      .notEmpty()
      .withMessage('Admin email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('adminPassword')
      .notEmpty()
      .withMessage('Password is required')
      .custom((value) => {
        const result = validatePassword(value);
        if (!result.isValid) {
          throw new Error(result.errors.join('. '));
        }
        return true;
      }),
  ],

  // Employee Signup (auto-join via domain)
  signup: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .custom((value) => {
        const result = validatePassword(value);
        if (!result.isValid) {
          throw new Error(result.errors.join('. '));
        }
        return true;
      }),
  ],

  // Signup with invite code
  signupWithInvite: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .custom((value) => {
        const result = validatePassword(value);
        if (!result.isValid) {
          throw new Error(result.errors.join('. '));
        }
        return true;
      }),
    body('inviteCode')
      .trim()
      .notEmpty()
      .withMessage('Invite code is required')
      .matches(/^GG-[A-Z]{1,4}-\d{4}$/)
      .withMessage('Invalid invite code format'),
  ],

  // Login
  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Change password
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .custom((value) => {
        const result = validatePassword(value);
        if (!result.isValid) {
          throw new Error(result.errors.join('. '));
        }
        return true;
      }),
  ],
};

module.exports = authValidators;
