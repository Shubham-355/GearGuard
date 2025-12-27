const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse } = require('../utils/helpers');

/**
 * Create work center
 * POST /api/work-centers
 */
const createWorkCenter = async (req, res, next) => {
  try {
    const {
      name,
      code,
      tag,
      costPerHour,
      capacityTimeEfficiency,
      oeeTarget,
      description,
      alternativeWorkCenterId,
    } = req.body;

    const companyId = req.user.companyId;

    // Verify alternative work center if provided
    if (alternativeWorkCenterId) {
      const altWorkCenter = await prisma.workCenter.findFirst({
        where: { id: alternativeWorkCenterId, companyId },
      });
      if (!altWorkCenter) {
        throw ApiError.badRequest('Invalid alternative work center');
      }
    }

    const workCenter = await prisma.workCenter.create({
      data: {
        name,
        code,
        tag,
        costPerHour: costPerHour || 0,
        capacityTimeEfficiency: capacityTimeEfficiency || 100,
        oeeTarget: oeeTarget || 85,
        description,
        companyId,
        alternativeWorkCenterId,
      },
      include: {
        alternativeWorkCenter: { select: { id: true, name: true, code: true } },
        _count: {
          select: { equipment: true },
        },
      },
    });

    res.status(201).json(
      new ApiResponse(201, { workCenter }, 'Work center created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all work centers
 * GET /api/work-centers
 */
const getWorkCenters = async (req, res, next) => {
  try {
    const { page, limit, search, isActive } = req.query;
    const { page: pageNum, limit: limitNum, offset } = getPagination(page, limit);
    const companyId = req.user.companyId;

    const where = {
      companyId,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { tag: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [workCenters, total] = await Promise.all([
      prisma.workCenter.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          alternativeWorkCenter: { select: { id: true, name: true, code: true } },
          _count: {
            select: { equipment: true },
          },
        },
      }),
      prisma.workCenter.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(workCenters, total, pageNum, limitNum), 'Work centers retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get work center by ID
 * GET /api/work-centers/:id
 */
const getWorkCenterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const workCenter = await prisma.workCenter.findFirst({
      where: { id, companyId },
      include: {
        alternativeWorkCenter: { select: { id: true, name: true, code: true } },
        alternativeFor: { select: { id: true, name: true, code: true } },
        equipment: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            status: true,
            healthPercentage: true,
            category: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { equipment: true },
        },
      },
    });

    if (!workCenter) {
      throw ApiError.notFound('Work center not found');
    }

    res.json(
      new ApiResponse(200, { workCenter }, 'Work center retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update work center
 * PUT /api/work-centers/:id
 */
const updateWorkCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      tag,
      costPerHour,
      capacityTimeEfficiency,
      oeeTarget,
      description,
      isActive,
      alternativeWorkCenterId,
    } = req.body;

    const companyId = req.user.companyId;

    const existingWorkCenter = await prisma.workCenter.findFirst({
      where: { id, companyId },
    });

    if (!existingWorkCenter) {
      throw ApiError.notFound('Work center not found');
    }

    // Verify alternative work center if changing
    if (alternativeWorkCenterId) {
      if (alternativeWorkCenterId === id) {
        throw ApiError.badRequest('Work center cannot be its own alternative');
      }
      const altWorkCenter = await prisma.workCenter.findFirst({
        where: { id: alternativeWorkCenterId, companyId },
      });
      if (!altWorkCenter) {
        throw ApiError.badRequest('Invalid alternative work center');
      }
    }

    const workCenter = await prisma.workCenter.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(tag !== undefined && { tag }),
        ...(costPerHour !== undefined && { costPerHour }),
        ...(capacityTimeEfficiency !== undefined && { capacityTimeEfficiency }),
        ...(oeeTarget !== undefined && { oeeTarget }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(alternativeWorkCenterId !== undefined && { alternativeWorkCenterId: alternativeWorkCenterId || null }),
      },
      include: {
        alternativeWorkCenter: { select: { id: true, name: true, code: true } },
        _count: {
          select: { equipment: true },
        },
      },
    });

    res.json(
      new ApiResponse(200, { workCenter }, 'Work center updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete work center
 * DELETE /api/work-centers/:id
 */
const deleteWorkCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const workCenter = await prisma.workCenter.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { equipment: true, alternativeFor: true },
        },
      },
    });

    if (!workCenter) {
      throw ApiError.notFound('Work center not found');
    }

    if (workCenter._count.equipment > 0) {
      throw ApiError.badRequest('Cannot delete work center with assigned equipment');
    }

    if (workCenter._count.alternativeFor > 0) {
      throw ApiError.badRequest('Cannot delete work center that is set as alternative for other work centers');
    }

    await prisma.workCenter.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'Work center deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get work center stats
 * GET /api/work-centers/stats
 */
const getWorkCenterStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [total, active, inactive, avgOEE, avgCost] = await Promise.all([
      prisma.workCenter.count({ where: { companyId } }),
      prisma.workCenter.count({ where: { companyId, isActive: true } }),
      prisma.workCenter.count({ where: { companyId, isActive: false } }),
      prisma.workCenter.aggregate({
        where: { companyId },
        _avg: { oeeTarget: true },
      }),
      prisma.workCenter.aggregate({
        where: { companyId },
        _avg: { costPerHour: true },
      }),
    ]);

    res.json(
      new ApiResponse(200, {
        total,
        active,
        inactive,
        avgOEETarget: avgOEE._avg.oeeTarget || 0,
        avgCostPerHour: avgCost._avg.costPerHour || 0,
      }, 'Work center stats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkCenter,
  getWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  deleteWorkCenter,
  getWorkCenterStats,
};
