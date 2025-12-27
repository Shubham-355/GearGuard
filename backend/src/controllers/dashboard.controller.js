const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { HEALTH_THRESHOLDS, EQUIPMENT_STATUS, REQUEST_STAGES, ROLES } = require('../config/constants');

/**
 * Get dashboard summary
 * GET /api/dashboard
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    // Get the first day of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel for better performance
    const [
      // Equipment stats
      totalEquipment,
      criticalEquipment,
      activeEquipment,
      
      // Request stats
      totalRequests,
      openRequests,
      overdueRequests,
      newRequests,
      inProgressRequests,
      completedThisMonth,
      repairedRequests,
      scrapRequests,
      
      // User stats
      totalTechnicians,
      
      // Team stats
      totalTeams,
    ] = await Promise.all([
      // Equipment
      prisma.equipment.count({ where: { companyId } }),
      prisma.equipment.count({
        where: {
          companyId,
          healthPercentage: { lt: HEALTH_THRESHOLDS.CRITICAL },
          status: { not: EQUIPMENT_STATUS.SCRAPPED },
        },
      }),
      prisma.equipment.count({
        where: {
          companyId,
          status: EQUIPMENT_STATUS.ACTIVE,
        },
      }),
      
      // Requests
      prisma.maintenanceRequest.count({ where: { companyId } }),
      prisma.maintenanceRequest.count({
        where: {
          companyId,
          stage: { in: [REQUEST_STAGES.NEW, REQUEST_STAGES.IN_PROGRESS] },
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          companyId,
          isOverdue: true,
          stage: { in: [REQUEST_STAGES.NEW, REQUEST_STAGES.IN_PROGRESS] },
        },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, stage: REQUEST_STAGES.NEW },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, stage: REQUEST_STAGES.IN_PROGRESS },
      }),
      prisma.maintenanceRequest.count({
        where: {
          companyId,
          stage: REQUEST_STAGES.REPAIRED,
          completionDate: { gte: startOfMonth },
        },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, stage: REQUEST_STAGES.REPAIRED },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, stage: REQUEST_STAGES.SCRAP },
      }),
      
      // Users
      prisma.user.count({
        where: {
          companyId,
          role: { in: [ROLES.TECHNICIAN, ROLES.MAINTENANCE_MANAGER] },
          isActive: true,
        },
      }),
      
      // Teams
      prisma.maintenanceTeam.count({ where: { companyId } }),
    ]);

    // Calculate technician load
    const technicianLoad = totalTechnicians > 0
      ? Math.round((inProgressRequests / totalTechnicians) * 100) / 100
      : 0;

    // Calculate utilization percentage (assuming max 5 requests per technician is 100%)
    const maxRequestsPerTech = 5;
    const utilizationPercentage = totalTechnicians > 0
      ? Math.min(100, Math.round((inProgressRequests / (totalTechnicians * maxRequestsPerTech)) * 100))
      : 0;

    res.json(
      new ApiResponse(200, {
        equipment: {
          total: totalEquipment,
          active: activeEquipment,
          critical: criticalEquipment,
          criticalThreshold: HEALTH_THRESHOLDS.CRITICAL,
        },
        requests: {
          total: totalRequests,
          open: openRequests,
          overdue: overdueRequests,
          new: newRequests,
          inProgress: inProgressRequests,
          completed: completedThisMonth,
          repaired: repairedRequests,
          scrap: scrapRequests,
        },
        technicians: {
          total: totalTechnicians,
          load: technicianLoad,
          utilizationPercentage,
        },
        teams: {
          total: totalTeams,
        },
      }, 'Dashboard summary retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard cards data (for the 3 main cards)
 * GET /api/dashboard/cards
 */
const getDashboardCards = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    // Card 1: Critical Equipment
    const criticalEquipment = await prisma.equipment.findMany({
      where: {
        companyId,
        healthPercentage: { lt: HEALTH_THRESHOLDS.CRITICAL },
        status: { not: EQUIPMENT_STATUS.SCRAPPED },
      },
      select: {
        id: true,
        name: true,
        healthPercentage: true,
        category: { select: { name: true } },
      },
      orderBy: { healthPercentage: 'asc' },
      take: 5,
    });

    // Card 2: Technician Load
    const techniciansWithLoad = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: [ROLES.TECHNICIAN, ROLES.MAINTENANCE_MANAGER] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            assignedRequests: {
              where: {
                stage: { in: [REQUEST_STAGES.NEW, REQUEST_STAGES.IN_PROGRESS] },
              },
            },
          },
        },
      },
    });

    const totalTechnicians = techniciansWithLoad.length;
    const totalAssignedRequests = techniciansWithLoad.reduce(
      (sum, tech) => sum + tech._count.assignedRequests,
      0
    );
    const utilizationPercentage = totalTechnicians > 0
      ? Math.min(100, Math.round((totalAssignedRequests / (totalTechnicians * 5)) * 100))
      : 0;

    // Card 3: Open Requests
    const [pendingCount, overdueCount, requestsByStage] = await Promise.all([
      prisma.maintenanceRequest.count({
        where: {
          companyId,
          stage: { in: [REQUEST_STAGES.NEW, REQUEST_STAGES.IN_PROGRESS] },
          isOverdue: false,
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          companyId,
          stage: { in: [REQUEST_STAGES.NEW, REQUEST_STAGES.IN_PROGRESS] },
          isOverdue: true,
        },
      }),
      prisma.maintenanceRequest.groupBy({
        by: ['stage'],
        where: { companyId },
        _count: true,
      }),
    ]);

    res.json(
      new ApiResponse(200, {
        criticalEquipment: {
          count: criticalEquipment.length,
          threshold: HEALTH_THRESHOLDS.CRITICAL,
          items: criticalEquipment,
        },
        technicianLoad: {
          totalTechnicians,
          totalAssignedRequests,
          utilizationPercentage,
          technicians: techniciansWithLoad.map(t => ({
            id: t.id,
            name: t.name,
            avatar: t.avatar,
            activeRequests: t._count.assignedRequests,
          })),
        },
        openRequests: {
          pending: pendingCount,
          overdue: overdueCount,
          total: pendingCount + overdueCount,
          byStage: requestsByStage.reduce((acc, item) => {
            acc[item.stage] = item._count;
            return acc;
          }, {}),
        },
      }, 'Dashboard cards data retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/activity
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { limit = 10 } = req.query;

    const recentRequests = await prisma.maintenanceRequest.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        subject: true,
        stage: true,
        priority: true,
        requestType: true,
        isOverdue: true,
        updatedAt: true,
        equipment: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json(
      new ApiResponse(200, { activity: recentRequests }, 'Recent activity retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get requests per team report
 * GET /api/dashboard/reports/requests-by-team
 */
const getRequestsByTeam = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const teams = await prisma.maintenanceTeam.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { maintenanceRequests: true },
        },
      },
    });

    // Get detailed breakdown per team
    const teamStats = await Promise.all(
      teams.map(async (team) => {
        const [newCount, inProgressCount, repairedCount, scrapCount] = await Promise.all([
          prisma.maintenanceRequest.count({
            where: { teamId: team.id, stage: REQUEST_STAGES.NEW },
          }),
          prisma.maintenanceRequest.count({
            where: { teamId: team.id, stage: REQUEST_STAGES.IN_PROGRESS },
          }),
          prisma.maintenanceRequest.count({
            where: { teamId: team.id, stage: REQUEST_STAGES.REPAIRED },
          }),
          prisma.maintenanceRequest.count({
            where: { teamId: team.id, stage: REQUEST_STAGES.SCRAP },
          }),
        ]);

        return {
          id: team.id,
          name: team.name,
          total: team._count.maintenanceRequests,
          new: newCount,
          inProgress: inProgressCount,
          repaired: repairedCount,
          scrap: scrapCount,
        };
      })
    );

    res.json(
      new ApiResponse(200, { teams: teamStats }, 'Requests by team retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get requests per category report
 * GET /api/dashboard/reports/requests-by-category
 */
const getRequestsByCategory = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const categories = await prisma.equipmentCategory.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { maintenanceRequests: true, equipment: true },
        },
      },
    });

    // Get breakdown per category
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const avgDuration = await prisma.maintenanceRequest.aggregate({
          where: {
            categoryId: category.id,
            duration: { not: null },
          },
          _avg: { duration: true },
        });

        return {
          id: category.id,
          name: category.name,
          totalRequests: category._count.maintenanceRequests,
          totalEquipment: category._count.equipment,
          avgRepairDuration: avgDuration._avg.duration || 0,
        };
      })
    );

    res.json(
      new ApiResponse(200, { categories: categoryStats }, 'Requests by category retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get equipment health distribution
 * GET /api/dashboard/reports/equipment-health
 */
const getEquipmentHealthDistribution = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [critical, warning, good, excellent] = await Promise.all([
      prisma.equipment.count({
        where: {
          companyId,
          status: { not: EQUIPMENT_STATUS.SCRAPPED },
          healthPercentage: { lt: 30 },
        },
      }),
      prisma.equipment.count({
        where: {
          companyId,
          status: { not: EQUIPMENT_STATUS.SCRAPPED },
          healthPercentage: { gte: 30, lt: 50 },
        },
      }),
      prisma.equipment.count({
        where: {
          companyId,
          status: { not: EQUIPMENT_STATUS.SCRAPPED },
          healthPercentage: { gte: 50, lt: 80 },
        },
      }),
      prisma.equipment.count({
        where: {
          companyId,
          status: { not: EQUIPMENT_STATUS.SCRAPPED },
          healthPercentage: { gte: 80 },
        },
      }),
    ]);

    res.json(
      new ApiResponse(200, {
        distribution: {
          critical: { count: critical, range: '0-29%' },
          warning: { count: warning, range: '30-49%' },
          good: { count: good, range: '50-79%' },
          excellent: { count: excellent, range: '80-100%' },
        },
        total: critical + warning + good + excellent,
      }, 'Equipment health distribution retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get maintenance trends (last 30 days)
 * GET /api/dashboard/reports/trends
 */
const getMaintenanceTrends = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get requests created in last 30 days, grouped by date
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        stage: true,
        requestType: true,
      },
    });

    // Group by date
    const dailyStats = {};
    requests.forEach(request => {
      const date = request.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          created: 0,
          corrective: 0,
          preventive: 0,
        };
      }
      dailyStats[date].created++;
      if (request.requestType === 'CORRECTIVE') {
        dailyStats[date].corrective++;
      } else {
        dailyStats[date].preventive++;
      }
    });

    // Convert to array and sort by date
    const trends = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

    res.json(
      new ApiResponse(200, { trends }, 'Maintenance trends retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get notifications
 * GET /api/dashboard/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();
    
    // Get recent critical events for notifications
    const [
      overdueRequests,
      criticalEquipment,
      newRequests,
      recentCompletions
    ] = await Promise.all([
      // Overdue maintenance requests
      prisma.maintenanceRequest.findMany({
        where: {
          companyId,
          isOverdue: true,
          stage: { in: [REQUEST_STAGES.NEW, REQUEST_STAGES.IN_PROGRESS] }
        },
        include: {
          equipment: { select: { name: true } },
          createdBy: { select: { name: true } }
        },
        orderBy: { scheduledDate: 'asc' },
        take: 5
      }),
      
      // Critical health equipment
      prisma.equipment.findMany({
        where: {
          companyId,
          healthPercentage: { lt: HEALTH_THRESHOLDS.CRITICAL },
          status: { not: EQUIPMENT_STATUS.SCRAPPED }
        },
        select: { id: true, name: true, healthPercentage: true },
        orderBy: { healthPercentage: 'asc' },
        take: 5
      }),
      
      // New requests from last 24 hours
      prisma.maintenanceRequest.findMany({
        where: {
          companyId,
          stage: REQUEST_STAGES.NEW,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        },
        include: {
          equipment: { select: { name: true } },
          createdBy: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      
      // Recent completions (last 24 hours)
      prisma.maintenanceRequest.findMany({
        where: {
          companyId,
          stage: REQUEST_STAGES.REPAIRED,
          completionDate: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        },
        include: {
          equipment: { select: { name: true } },
          technician: { select: { name: true } }
        },
        orderBy: { completionDate: 'desc' },
        take: 3
      })
    ]);

    const notifications = [];

    // Add overdue requests notifications
    overdueRequests.forEach(request => {
      notifications.push({
        id: `overdue-${request.id}`,
        title: 'Overdue Maintenance',
        message: `${request.equipment?.name || 'Equipment'} maintenance is overdue`,
        time: formatTimeAgo(request.scheduledDate),
        type: 'critical',
        unread: true,
        link: `/maintenance/requests/${request.id}`
      });
    });

    // Add critical equipment notifications
    criticalEquipment.forEach(equipment => {
      notifications.push({
        id: `critical-${equipment.id}`,
        title: 'Critical Equipment Health',
        message: `${equipment.name} health dropped to ${equipment.healthPercentage}%`,
        time: formatTimeAgo(new Date()),
        type: 'warning',
        unread: true,
        link: `/equipment/${equipment.id}`
      });
    });

    // Add new requests notifications
    newRequests.forEach(request => {
      notifications.push({
        id: `new-${request.id}`,
        title: 'New Maintenance Request',
        message: `${request.equipment?.name || 'Equipment'} needs attention`,
        time: formatTimeAgo(request.createdAt),
        type: 'alert',
        unread: true,
        link: `/maintenance/requests/${request.id}`
      });
    });

    // Add completion notifications
    recentCompletions.forEach(request => {
      notifications.push({
        id: `completed-${request.id}`,
        title: 'Maintenance Completed',
        message: `${request.equipment?.name || 'Equipment'} repair completed`,
        time: formatTimeAgo(request.completionDate),
        type: 'success',
        unread: false,
        link: `/maintenance/requests/${request.id}`
      });
    });

    // Sort by most recent first
    notifications.sort((a, b) => {
      // Unread first, then by implied timestamp
      if (a.unread !== b.unread) return b.unread - a.unread;
      return new Date(b.time) - new Date(a.time);
    });

    res.json(
      new ApiResponse(200, { 
        notifications: notifications.slice(0, 20), // Limit to 20
        unreadCount: notifications.filter(n => n.unread).length 
      }, 'Notifications retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
}

module.exports = {
  getDashboardSummary,
  getDashboardCards,
  getRecentActivity,
  getRequestsByTeam,
  getRequestsByCategory,
  getEquipmentHealthDistribution,
  getMaintenanceTrends,
  getNotifications,
};
