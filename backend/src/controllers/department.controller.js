const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse } = require('../utils/helpers');

/**
 * Create department
 * POST /api/departments
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const companyId = req.user.companyId;

    const department = await prisma.department.create({
      data: {
        name,
        description,
        companyId,
      },
      include: {
        _count: {
          select: { users: true, equipment: true },
        },
      },
    });

    res.status(201).json(
      new ApiResponse(201, { department }, 'Department created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all departments
 * GET /api/departments
 */
const getDepartments = async (req, res, next) => {
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

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { users: true, equipment: true, equipmentCategories: true },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(departments, total, pageNum, limitNum), 'Departments retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID
 * GET /api/departments/:id
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const department = await prisma.department.findFirst({
      where: { id, companyId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
          take: 10,
        },
        equipment: {
          select: { id: true, name: true, serialNumber: true, status: true },
          take: 10,
        },
        equipmentCategories: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, equipment: true, equipmentCategories: true },
        },
      },
    });

    if (!department) {
      throw ApiError.notFound('Department not found');
    }

    res.json(
      new ApiResponse(200, { department }, 'Department retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update department
 * PUT /api/departments/:id
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const companyId = req.user.companyId;

    const existingDepartment = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!existingDepartment) {
      throw ApiError.notFound('Department not found');
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        _count: {
          select: { users: true, equipment: true },
        },
      },
    });

    res.json(
      new ApiResponse(200, { department }, 'Department updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete department
 * DELETE /api/departments/:id
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const department = await prisma.department.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { users: true, equipment: true },
        },
      },
    });

    if (!department) {
      throw ApiError.notFound('Department not found');
    }

    if (department._count.users > 0 || department._count.equipment > 0) {
      const reasons = [];
      
      if (department._count.users > 0) {
        reasons.push(`${department._count.users} user${department._count.users > 1 ? 's' : ''}`);
      }
      if (department._count.equipment > 0) {
        reasons.push(`${department._count.equipment} equipment${department._count.equipment > 1 ? 's' : ''}`);
      }

      const reasonText = reasons.join(' and ');
      
      throw ApiError.badRequest(
        `Cannot delete department "${department.name}". It has ${reasonText} assigned. Please reassign them first.`
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'Department deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
