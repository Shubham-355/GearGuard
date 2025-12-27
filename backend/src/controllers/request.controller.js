const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse, isOverdue } = require('../utils/helpers');
const { REQUEST_STAGES, EQUIPMENT_STATUS, ROLES } = require('../config/constants');
const { sendEmail } = require('../config/email');

/**
 * Create maintenance request
 * POST /api/requests
 */
const createRequest = async (req, res, next) => {
  try {
    const {
      subject,
      description,
      requestType,
      priority,
      equipmentId,
      scheduledDate,
      technicianId,
      teamId,
    } = req.body;

    const companyId = req.user.companyId;
    let autoFilledData = {};

    // Auto-fill from equipment if provided
    if (equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: { id: equipmentId, companyId },
        include: {
          category: true,
          maintenanceTeam: true,
          technician: true,
        },
      });

      if (!equipment) {
        throw ApiError.badRequest('Invalid equipment');
      }

      // Auto-fill category, team, and technician from equipment
      autoFilledData = {
        categoryId: equipment.categoryId,
        teamId: teamId || equipment.maintenanceTeamId,
        technicianId: technicianId || equipment.technicianId,
      };
    }

    // Verify team if provided
    if (teamId || autoFilledData.teamId) {
      const team = await prisma.maintenanceTeam.findFirst({
        where: { id: teamId || autoFilledData.teamId, companyId },
      });
      if (!team) throw ApiError.badRequest('Invalid maintenance team');
    }

    // Verify technician if provided
    if (technicianId || autoFilledData.technicianId) {
      const technician = await prisma.user.findFirst({
        where: {
          id: technicianId || autoFilledData.technicianId,
          companyId,
          role: { in: [ROLES.TECHNICIAN, ROLES.MAINTENANCE_MANAGER] },
        },
      });
      if (!technician) throw ApiError.badRequest('Invalid technician');
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        subject,
        description,
        requestType: requestType || 'CORRECTIVE',
        priority: priority || 'MEDIUM',
        stage: 'NEW',
        companyId,
        equipmentId,
        categoryId: autoFilledData.categoryId,
        teamId: teamId || autoFilledData.teamId,
        technicianId: technicianId || autoFilledData.technicianId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        createdById: req.user.id,
        isOverdue: scheduledDate ? isOverdue(scheduledDate) : false,
      },
      include: {
        equipment: { select: { id: true, name: true, serialNumber: true } },
        category: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Send email notifications for new request
    // Notify assigned technician
    if (request.technician?.email) {
      sendEmail(request.technician.email, 'requestAssigned', [request, request.technician, request.equipment]);
    }
    // Notify team leads
    if (request.team) {
      const teamLeads = await prisma.teamMember.findMany({
        where: { teamId: request.team.id, isLead: true },
        include: { user: { select: { email: true, name: true } } },
      });
      teamLeads.forEach(lead => {
        sendEmail(lead.user.email, 'requestCreated', [request, request.equipment, request.createdBy, request.team]);
      });
    }

    res.status(201).json(
      new ApiResponse(201, { request }, 'Maintenance request created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all maintenance requests with filters
 * GET /api/requests
 */
const getRequests = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      stage,
      requestType,
      priority,
      equipmentId,
      teamId,
      technicianId,
      createdById,
      isOverdue: overdueFilter,
      fromDate,
      toDate,
    } = req.query;

    const { page: pageNum, limit: limitNum, offset } = getPagination(page, limit);
    const companyId = req.user.companyId;

    // Build where clause
    const where = {
      companyId,
      ...(stage && { stage }),
      ...(requestType && { requestType }),
      ...(priority && { priority }),
      ...(equipmentId && { equipmentId }),
      ...(teamId && { teamId }),
      ...(technicianId && { technicianId }),
      ...(createdById && { createdById }),
      ...(overdueFilter !== undefined && { isOverdue: overdueFilter === 'true' }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Date range filter
    if (fromDate || toDate) {
      where.requestDate = {};
      if (fromDate) where.requestDate.gte = new Date(fromDate);
      if (toDate) where.requestDate.lte = new Date(toDate);
    }

    // For technicians, show only their team's requests or assigned to them
    if (req.user.role === ROLES.TECHNICIAN) {
      const userTeamIds = req.user.teamMemberships?.map(tm => tm.teamId) || [];
      where.OR = [
        { technicianId: req.user.id },
        { teamId: { in: userTeamIds } },
        { createdById: req.user.id },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: [
          { isOverdue: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          equipment: { select: { id: true, name: true, serialNumber: true } },
          category: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          technician: { select: { id: true, name: true, email: true, avatar: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(requests, total, pageNum, limitNum), 'Requests retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get request by ID
 * GET /api/requests/:id
 */
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const request = await prisma.maintenanceRequest.findFirst({
      where: { id, companyId },
      include: {
        equipment: {
          include: {
            category: true,
            department: true,
            maintenanceTeam: true,
          },
        },
        category: true,
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
        },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    res.json(
      new ApiResponse(200, { request }, 'Request retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update maintenance request
 * PUT /api/requests/:id
 */
const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: { id, companyId },
    });

    if (!existingRequest) {
      throw ApiError.notFound('Request not found');
    }

    const {
      subject,
      description,
      requestType,
      priority,
      stage,
      equipmentId,
      scheduledDate,
      technicianId,
      teamId,
      duration,
      notes,
    } = req.body;

    const updateData = {};

    if (subject !== undefined) updateData.subject = subject;
    if (description !== undefined) updateData.description = description;
    if (requestType !== undefined) updateData.requestType = requestType;
    if (priority !== undefined) updateData.priority = priority;
    if (equipmentId !== undefined) updateData.equipmentId = equipmentId || null;
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (technicianId !== undefined) updateData.technicianId = technicianId || null;
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;

    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
      updateData.isOverdue = scheduledDate ? isOverdue(scheduledDate) : false;
    }

    // Handle stage transitions
    if (stage !== undefined && stage !== existingRequest.stage) {
      updateData.stage = stage;

      if (stage === REQUEST_STAGES.IN_PROGRESS && !existingRequest.startDate) {
        updateData.startDate = new Date();
      }

      if (stage === REQUEST_STAGES.REPAIRED) {
        updateData.completionDate = new Date();
        // Calculate duration if not provided
        if (!duration && existingRequest.startDate) {
          const start = existingRequest.startDate;
          const end = new Date();
          updateData.duration = Math.round((end - start) / (1000 * 60 * 60) * 100) / 100;
        }
      }

      // Handle scrap logic
      if (stage === REQUEST_STAGES.SCRAP && existingRequest.equipmentId) {
        await prisma.equipment.update({
          where: { id: existingRequest.equipmentId },
          data: {
            status: EQUIPMENT_STATUS.SCRAPPED,
            scrapDate: new Date(),
          },
        });
      }
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        equipment: { select: { id: true, name: true, serialNumber: true } },
        category: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(
      new ApiResponse(200, { request }, 'Request updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update request stage (Kanban drag-drop)
 * PATCH /api/requests/:id/stage
 */
const updateStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, duration, notes } = req.body;
    const companyId = req.user.companyId;

    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: { id, companyId },
    });

    if (!existingRequest) {
      throw ApiError.notFound('Request not found');
    }

    const updateData = { stage };

    // Handle stage-specific logic
    if (stage === REQUEST_STAGES.IN_PROGRESS) {
      if (!existingRequest.startDate) {
        updateData.startDate = new Date();
      }
      // Auto-assign if not assigned
      if (!existingRequest.technicianId && req.user.role === ROLES.TECHNICIAN) {
        updateData.technicianId = req.user.id;
      }
      // Set equipment to UNDER_MAINTENANCE
      if (existingRequest.equipmentId) {
        await prisma.equipment.update({
          where: { id: existingRequest.equipmentId },
          data: { status: EQUIPMENT_STATUS.UNDER_MAINTENANCE },
        });
      }
    }

    if (stage === REQUEST_STAGES.REPAIRED) {
      updateData.completionDate = new Date();
      if (duration !== undefined) {
        updateData.duration = duration;
      } else if (existingRequest.startDate) {
        const start = existingRequest.startDate;
        const end = new Date();
        updateData.duration = Math.round((end - start) / (1000 * 60 * 60) * 100) / 100;
      }
      // Set equipment back to ACTIVE when repaired
      if (existingRequest.equipmentId) {
        await prisma.equipment.update({
          where: { id: existingRequest.equipmentId },
          data: { status: EQUIPMENT_STATUS.ACTIVE },
        });
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Handle scrap logic
    if (stage === REQUEST_STAGES.SCRAP && existingRequest.equipmentId) {
      const scrapEquipment = await prisma.equipment.update({
        where: { id: existingRequest.equipmentId },
        data: {
          status: EQUIPMENT_STATUS.SCRAPPED,
          scrapDate: new Date(),
        },
      });
      
      // Send equipment scrapped notification to admin/managers
      const admins = await prisma.user.findMany({
        where: { companyId, role: { in: ['ADMIN', 'MAINTENANCE_MANAGER'] } },
        select: { email: true },
      });
      admins.forEach(admin => {
        sendEmail(admin.email, 'equipmentScrapped', [scrapEquipment, existingRequest]);
      });
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        equipment: { select: { id: true, name: true, serialNumber: true } },
        category: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Send stage update notification to creator
    if (request.createdBy?.email && existingRequest.stage !== stage) {
      sendEmail(request.createdBy.email, 'requestStageUpdated', [request, existingRequest.stage, stage, request.equipment]);
    }

    res.json(
      new ApiResponse(200, { request }, 'Request stage updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Assign technician to request
 * PATCH /api/requests/:id/assign
 */
const assignTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;
    const companyId = req.user.companyId;

    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: { id, companyId },
    });

    if (!existingRequest) {
      throw ApiError.notFound('Request not found');
    }

    // Verify technician
    const technician = await prisma.user.findFirst({
      where: {
        id: technicianId,
        companyId,
        role: { in: [ROLES.TECHNICIAN, ROLES.MAINTENANCE_MANAGER] },
        isActive: true,
      },
    });

    if (!technician) {
      throw ApiError.badRequest('Invalid technician');
    }

    // If request has a team, verify technician is a team member
    if (existingRequest.teamId) {
      const isMember = await prisma.teamMember.findFirst({
        where: {
          userId: technicianId,
          teamId: existingRequest.teamId,
        },
      });

      // Allow managers to assign anyone, but warn
      if (!isMember && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MAINTENANCE_MANAGER) {
        throw ApiError.badRequest('Technician is not a member of the assigned team');
      }
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: { technicianId },
      include: {
        equipment: { select: { id: true, name: true, serialNumber: true } },
        category: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Send email notification to assigned technician
    if (technician.email) {
      sendEmail(technician.email, 'requestAssigned', [request, technician, request.equipment]);
    }

    res.json(
      new ApiResponse(200, { request }, 'Technician assigned successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Self-assign request (for technicians)
 * PATCH /api/requests/:id/self-assign
 */
const selfAssign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: { id, companyId },
    });

    if (!existingRequest) {
      throw ApiError.notFound('Request not found');
    }

    if (existingRequest.technicianId) {
      throw ApiError.badRequest('Request is already assigned');
    }

    // Check team membership if request has a team
    if (existingRequest.teamId) {
      const isMember = await prisma.teamMember.findFirst({
        where: {
          userId: req.user.id,
          teamId: existingRequest.teamId,
        },
      });

      if (!isMember && req.user.role === ROLES.TECHNICIAN) {
        throw ApiError.forbidden('You are not a member of the assigned team');
      }
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: { technicianId: req.user.id },
      include: {
        equipment: { select: { id: true, name: true, serialNumber: true } },
        category: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(
      new ApiResponse(200, { request }, 'Request self-assigned successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete request
 * DELETE /api/requests/:id
 */
const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const request = await prisma.maintenanceRequest.findFirst({
      where: { id, companyId },
    });

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    // Only allow deletion of NEW requests or by admins
    if (request.stage !== REQUEST_STAGES.NEW && req.user.role !== ROLES.ADMIN) {
      throw ApiError.badRequest('Only new requests can be deleted');
    }

    await prisma.maintenanceRequest.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'Request deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get requests grouped by stage (Kanban)
 * GET /api/requests/kanban
 */
const getKanbanRequests = async (req, res, next) => {
  try {
    const { teamId, technicianId, priority } = req.query;
    const companyId = req.user.companyId;

    const where = {
      companyId,
      ...(teamId && { teamId }),
      ...(technicianId && { technicianId }),
      ...(priority && { priority }),
    };

    // For technicians, filter by their teams
    if (req.user.role === ROLES.TECHNICIAN) {
      const userTeamIds = req.user.teamMemberships?.map(tm => tm.teamId) || [];
      where.OR = [
        { technicianId: req.user.id },
        { teamId: { in: userTeamIds } },
      ];
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: [
        { isOverdue: 'desc' },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        equipment: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, avatar: true } },
        team: { select: { id: true, name: true } },
      },
    });

    // Group by stage
    const kanban = {
      NEW: [],
      IN_PROGRESS: [],
      REPAIRED: [],
      SCRAP: [],
    };

    requests.forEach(request => {
      if (kanban[request.stage]) {
        kanban[request.stage].push(request);
      }
    });

    res.json(
      new ApiResponse(200, { kanban }, 'Kanban data retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get calendar requests (for calendar view)
 * GET /api/requests/calendar
 */
const getCalendarRequests = async (req, res, next) => {
  try {
    const { startDate, endDate, requestType, teamId } = req.query;
    const companyId = req.user.companyId;

    const where = {
      companyId,
      scheduledDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...(requestType && { requestType }),
      ...(teamId && { teamId }),
    };

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        equipment: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, avatar: true } },
        team: { select: { id: true, name: true } },
      },
    });

    // Format for calendar
    const calendarEvents = requests.map(request => ({
      id: request.id,
      title: request.subject,
      start: request.scheduledDate,
      end: request.scheduledDate,
      type: request.requestType,
      stage: request.stage,
      priority: request.priority,
      isOverdue: request.isOverdue,
      equipment: request.equipment,
      technician: request.technician,
      team: request.team,
    }));

    res.json(
      new ApiResponse(200, { events: calendarEvents }, 'Calendar events retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get request stats
 * GET /api/requests/stats
 */
const getRequestStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [total, byStage, byType, byPriority, overdue, avgDuration] = await Promise.all([
      prisma.maintenanceRequest.count({ where: { companyId } }),
      prisma.maintenanceRequest.groupBy({
        by: ['stage'],
        where: { companyId },
        _count: true,
      }),
      prisma.maintenanceRequest.groupBy({
        by: ['requestType'],
        where: { companyId },
        _count: true,
      }),
      prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where: { companyId },
        _count: true,
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, isOverdue: true },
      }),
      prisma.maintenanceRequest.aggregate({
        where: { companyId, duration: { not: null } },
        _avg: { duration: true },
      }),
    ]);

    const openRequests = byStage
      .filter(s => ['NEW', 'IN_PROGRESS'].includes(s.stage))
      .reduce((sum, s) => sum + s._count, 0);

    res.json(
      new ApiResponse(200, {
        total,
        open: openRequests,
        overdue,
        avgDuration: avgDuration._avg.duration || 0,
        byStage: byStage.reduce((acc, s) => {
          acc[s.stage] = s._count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, t) => {
          acc[t.requestType] = t._count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, p) => {
          acc[p.priority] = p._count;
          return acc;
        }, {}),
      }, 'Request stats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  updateStage,
  assignTechnician,
  selfAssign,
  deleteRequest,
  getKanbanRequests,
  getCalendarRequests,
  getRequestStats,
};
