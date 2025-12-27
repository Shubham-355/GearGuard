const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Dashboard summary
router.get('/', dashboardController.getDashboardSummary);

// Dashboard cards (3 main cards)
router.get('/cards', dashboardController.getDashboardCards);

// Recent activity
router.get('/activity', dashboardController.getRecentActivity);

// Reports
router.get('/reports/requests-by-team', dashboardController.getRequestsByTeam);
router.get('/reports/requests-by-category', dashboardController.getRequestsByCategory);
router.get('/reports/equipment-health', dashboardController.getEquipmentHealthDistribution);
router.get('/reports/trends', dashboardController.getMaintenanceTrends);

module.exports = router;
