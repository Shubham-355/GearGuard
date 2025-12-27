const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse } = require('../utils/helpers');

/**
 * Create equipment category
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, responsibleDeptId } = req.body;
    const companyId = req.user.companyId;

    // Verify department if provided
    if (responsibleDeptId) {
      const department = await prisma.department.findFirst({
        where: { id: responsibleDeptId, companyId },
      });
      if (!department) {
        throw ApiError.badRequest('Invalid department');
      }
    }

    const category = await prisma.equipmentCategory.create({
      data: {
        name,
        description,
        companyId,
        responsibleDeptId,
      },
      include: {
        responsibleDept: { select: { id: true, name: true } },
        _count: {
          select: { equipment: true },
        },
      },
    });

    res.status(201).json(
      new ApiResponse(201, { category }, 'Category created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories
 * GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { page: pageNum, limit: limitNum, offset } = getPagination(page, limit);
    const companyId = req.user.companyId;

    const where = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [categories, total] = await Promise.all([
      prisma.equipmentCategory.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          responsibleDept: { select: { id: true, name: true } },
          _count: {
            select: { equipment: true, maintenanceRequests: true },
          },
        },
      }),
      prisma.equipmentCategory.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(categories, total, pageNum, limitNum), 'Categories retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const category = await prisma.equipmentCategory.findFirst({
      where: { id, companyId },
      include: {
        responsibleDept: true,
        equipment: {
          select: { id: true, name: true, serialNumber: true, status: true, healthPercentage: true },
          take: 10,
        },
        _count: {
          select: { equipment: true, maintenanceRequests: true },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    res.json(
      new ApiResponse(200, { category }, 'Category retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, responsibleDeptId } = req.body;
    const companyId = req.user.companyId;

    const existingCategory = await prisma.equipmentCategory.findFirst({
      where: { id, companyId },
    });

    if (!existingCategory) {
      throw ApiError.notFound('Category not found');
    }

    // Verify department if changing
    if (responsibleDeptId) {
      const department = await prisma.department.findFirst({
        where: { id: responsibleDeptId, companyId },
      });
      if (!department) {
        throw ApiError.badRequest('Invalid department');
      }
    }

    const category = await prisma.equipmentCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(responsibleDeptId !== undefined && { responsibleDeptId: responsibleDeptId || null }),
      },
      include: {
        responsibleDept: { select: { id: true, name: true } },
        _count: {
          select: { equipment: true },
        },
      },
    });

    res.json(
      new ApiResponse(200, { category }, 'Category updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const category = await prisma.equipmentCategory.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category._count.equipment > 0) {
      throw ApiError.badRequest('Cannot delete category with assigned equipment');
    }

    await prisma.equipmentCategory.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'Category deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
