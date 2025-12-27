const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Get company information
router.get('/', companyController.getCompany);

// Update allowed domains (Admin only)
router.put('/allowed-domains', isAdmin, companyController.updateAllowedDomains);

module.exports = router;
