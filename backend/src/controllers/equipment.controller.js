const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse } = require('../utils/helpers');
const { EQUIPMENT_STATUS, HEALTH_THRESHOLDS } = require('../config/constants');

/**
 * Create new equipment
 * POST /api/equipment
 */
const createEquipment = async (req, res, next) => {
  try {
    const {
      name,
      serialNumber,
      model,
      purchaseDate,
      warrantyExpiry,
      location,
      description,
      healthPercentage,
      categoryId,
      departmentId,
      ownerId,
      technicianId,
      maintenanceTeamId,
      workCenterId,
    } = req.body;

    const companyId = req.user.companyId;

    // Verify related entities belong to company
    if (categoryId) {
      const category = await prisma.equipmentCategory.findFirst({
        where: { id: categoryId, companyId },
      });
      if (!category) throw ApiError.badRequest('Invalid category');
    }

    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, companyId },
      });
      if (!department) throw ApiError.badRequest('Invalid department');
    }

    if (ownerId) {
      const owner = await prisma.user.findFirst({
        where: { id: ownerId, companyId },
      });
      if (!owner) throw ApiError.badRequest('Invalid owner');
    }

    if (technicianId) {
      const technician = await prisma.user.findFirst({
        where: { id: technicianId, companyId },
      });
      if (!technician) throw ApiError.badRequest('Invalid technician');
    }

    if (maintenanceTeamId) {
      const team = await prisma.maintenanceTeam.findFirst({
        where: { id: maintenanceTeamId, companyId },
      });
      if (!team) throw ApiError.badRequest('Invalid maintenance team');
    }

    if (workCenterId) {
      const workCenter = await prisma.workCenter.findFirst({
        where: { id: workCenterId, companyId },
      });
      if (!workCenter) throw ApiError.badRequest('Invalid work center');
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        serialNumber,
        model,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        location,
        description,
        healthPercentage: healthPercentage || 100,
        companyId,
        categoryId,
        departmentId,
        ownerId,
        technicianId,
        maintenanceTeamId,
        workCenterId,
        assignedDate: ownerId ? new Date() : null,
      },
      include: {
        category: true,
        department: true,
        owner: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        maintenanceTeam: true,
        workCenter: true,
      },
    });

    res.status(201).json(
      new ApiResponse(201, { equipment }, 'Equipment created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all equipment with filters
 * GET /api/equipment
 */
const getEquipment = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      status,
      categoryId,
      departmentId,
      ownerId,
      teamId,
      healthBelow,
    } = req.query;

    const { page: pageNum, limit: limitNum, offset } = getPagination(page, limit);
    const companyId = req.user.companyId;

    const where = {
      companyId,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(departmentId && { departmentId }),
      ...(ownerId && { ownerId }),
      ...(teamId && { maintenanceTeamId: teamId }),
      ...(healthBelow && { healthPercentage: { lt: parseInt(healthBelow) } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
          technician: { select: { id: true, name: true, email: true } },
          maintenanceTeam: { select: { id: true, name: true } },
          workCenter: { select: { id: true, name: true, code: true } },
          _count: {
            select: { maintenanceRequests: true },
          },
        },
      }),
      prisma.equipment.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(equipment, total, pageNum, limitNum), 'Equipment retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get equipment by ID
 * GET /api/equipment/:id
 */
const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const equipment = await prisma.equipment.findFirst({
      where: { id, companyId },
      include: {
        category: true,
        department: true,
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        maintenanceTeam: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        workCenter: true,
        _count: {
          select: { maintenanceRequests: true },
        },
      },
    });

    if (!equipment) {
      throw ApiError.notFound('Equipment not found');
    }

    // Get open request count for smart button
    const openRequestCount = await prisma.maintenanceRequest.count({
      where: {
        equipmentId: id,
        stage: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    res.json(
      new ApiResponse(200, {
        equipment: {
          ...equipment,
          openRequestCount,
        },
      }, 'Equipment retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update equipment
 * PUT /api/equipment/:id
 */
const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findFirst({
      where: { id, companyId },
    });

    if (!existingEquipment) {
      throw ApiError.notFound('Equipment not found');
    }

    const {
      name,
      serialNumber,
      model,
      purchaseDate,
      warrantyExpiry,
      location,
      description,
      healthPercentage,
      status,
      categoryId,
      departmentId,
      ownerId,
      technicianId,
      maintenanceTeamId,
      workCenterId,
    } = req.body;

    // Build update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (model !== undefined) updateData.model = model;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (warrantyExpiry !== undefined) updateData.warrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (healthPercentage !== undefined) updateData.healthPercentage = healthPercentage;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (ownerId !== undefined) {
      updateData.ownerId = ownerId || null;
      if (ownerId && !existingEquipment.ownerId) {
        updateData.assignedDate = new Date();
      }
    }
    if (technicianId !== undefined) updateData.technicianId = technicianId || null;
    if (maintenanceTeamId !== undefined) updateData.maintenanceTeamId = maintenanceTeamId || null;
    if (workCenterId !== undefined) updateData.workCenterId = workCenterId || null;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        department: true,
        owner: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        maintenanceTeam: true,
        workCenter: true,
      },
    });

    res.json(
      new ApiResponse(200, { equipment }, 'Equipment updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete equipment
 * DELETE /api/equipment/:id
 */
const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const equipment = await prisma.equipment.findFirst({
      where: { id, companyId },
    });

    if (!equipment) {
      throw ApiError.notFound('Equipment not found');
    }

    // Check for active maintenance requests
    const activeRequests = await prisma.maintenanceRequest.count({
      where: {
        equipmentId: id,
        stage: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    if (activeRequests > 0) {
      throw ApiError.badRequest('Cannot delete equipment with active maintenance requests');
    }

    await prisma.equipment.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'Equipment deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Scrap equipment
 * POST /api/equipment/:id/scrap
 */
const scrapEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const companyId = req.user.companyId;

    const equipment = await prisma.equipment.findFirst({
      where: { id, companyId },
    });

    if (!equipment) {
      throw ApiError.notFound('Equipment not found');
    }

    if (equipment.status === EQUIPMENT_STATUS.SCRAPPED) {
      throw ApiError.badRequest('Equipment is already scrapped');
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        status: EQUIPMENT_STATUS.SCRAPPED,
        scrapDate: new Date(),
        description: reason
          ? `${equipment.description || ''}\n\nScrap Reason: ${reason}`.trim()
          : equipment.description,
      },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        maintenanceTeam: { select: { id: true, name: true } },
        workCenter: { select: { id: true, name: true } },
      },
    });

    res.json(
      new ApiResponse(200, { equipment: updatedEquipment }, 'Equipment scrapped successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get maintenance requests for equipment (Smart Button)
 * GET /api/equipment/:id/requests
 */
const getEquipmentRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, stage } = req.query;
    const { page: pageNum, limit: limitNum, offset } = getPagination(page, limit);
    const companyId = req.user.companyId;

    // Verify equipment exists
    const equipment = await prisma.equipment.findFirst({
      where: { id, companyId },
    });

    if (!equipment) {
      throw ApiError.notFound('Equipment not found');
    }

    const where = {
      equipmentId: id,
      ...(stage && { stage }),
    };

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          technician: { select: { id: true, name: true, email: true } },
          team: { select: { id: true, name: true } },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(requests, total, pageNum, limitNum), 'Equipment requests retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get critical equipment (health < 30%)
 * GET /api/equipment/critical
 */
const getCriticalEquipment = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const criticalEquipment = await prisma.equipment.findMany({
      where: {
        companyId,
        healthPercentage: { lt: HEALTH_THRESHOLDS.CRITICAL },
        status: { not: EQUIPMENT_STATUS.SCRAPPED },
      },
      orderBy: { healthPercentage: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
        maintenanceTeam: { select: { id: true, name: true } },
      },
    });

    res.json(
      new ApiResponse(200, {
        count: criticalEquipment.length,
        equipment: criticalEquipment,
      }, 'Critical equipment retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get equipment stats
 * GET /api/equipment/stats
 */
const getEquipmentStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [total, byStatus, byCategory, byDepartment, critical] = await Promise.all([
      prisma.equipment.count({ where: { companyId } }),
      prisma.equipment.groupBy({
        by: ['status'],
        where: { companyId },
        _count: true,
      }),
      prisma.equipment.groupBy({
        by: ['categoryId'],
        where: { companyId, categoryId: { not: null } },
        _count: true,
      }),
      prisma.equipment.groupBy({
        by: ['departmentId'],
        where: { companyId, departmentId: { not: null } },
        _count: true,
      }),
      prisma.equipment.count({
        where: {
          companyId,
          healthPercentage: { lt: HEALTH_THRESHOLDS.CRITICAL },
          status: { not: EQUIPMENT_STATUS.SCRAPPED },
        },
      }),
    ]);

    // Get category names
    const categoryIds = byCategory.map(c => c.categoryId);
    const categories = await prisma.equipmentCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    // Get department names
    const departmentIds = byDepartment.map(d => d.departmentId);
    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true },
    });

    const categoryStats = byCategory.map(c => ({
      category: categories.find(cat => cat.id === c.categoryId)?.name || 'Unknown',
      count: c._count,
    }));

    const departmentStats = byDepartment.map(d => ({
      department: departments.find(dept => dept.id === d.departmentId)?.name || 'Unknown',
      count: d._count,
    }));

    res.json(
      new ApiResponse(200, {
        total,
        critical,
        byStatus: byStatus.reduce((acc, s) => {
          acc[s.status] = s._count;
          return acc;
        }, {}),
        byCategory: categoryStats,
        byDepartment: departmentStats,
      }, 'Equipment stats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  scrapEquipment,
  getEquipmentRequests,
  getCriticalEquipment,
  getEquipmentStats,
};
