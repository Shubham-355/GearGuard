const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const equipmentRoutes = require('./equipment.routes');
const requestRoutes = require('./request.routes');
const teamRoutes = require('./team.routes');
const categoryRoutes = require('./category.routes');
const departmentRoutes = require('./department.routes');
const workCenterRoutes = require('./workCenter.routes');
const dashboardRoutes = require('./dashboard.routes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GearGuard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/requests', requestRoutes);
router.use('/teams', teamRoutes);
router.use('/categories', categoryRoutes);
router.use('/departments', departmentRoutes);
router.use('/work-centers', workCenterRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
