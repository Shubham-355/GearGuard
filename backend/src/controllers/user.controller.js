const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse } = require('../utils/helpers');
const { ROLES } = require('../config/constants');
const { sendEmail } = require('../config/email');

/**
 * Create a new user (Admin/Manager)
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    const companyId = req.user.companyId;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Validate role permissions
    if (req.user.role === ROLES.MAINTENANCE_MANAGER) {
      // Managers can only create Technicians and Employees
      if (role && ![ROLES.TECHNICIAN, ROLES.EMPLOYEE].includes(role)) {
        throw ApiError.forbidden('You can only create Technician or Employee accounts');
      }
    }

    // Verify department belongs to company
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, companyId },
      });
      if (!department) {
        throw ApiError.badRequest('Invalid department');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || ROLES.EMPLOYEE,
        companyId,
        departmentId,
      },
      include: {
        company: { select: { id: true, name: true } },
        department: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    // Send welcome email
    sendEmail(user.email, 'welcome', [user, user.company]);

    res.status(201).json(
      new ApiResponse(201, { user: userWithoutPassword }, 'User created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with filters
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search, departmentId, isActive } = req.query;
    const { page: pageNum, limit: limitNum, offset } = getPagination(page, limit);
    const companyId = req.user.companyId;

    // Build filters
    const where = {
      companyId,
      ...(role && { role }),
      ...(departmentId && { departmentId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get users with count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
          teamMemberships: {
            select: {
              team: { select: { id: true, name: true } },
              isLead: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(users, total, pageNum, limitNum), 'Users retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true } },
        department: true,
        teamMemberships: {
          include: {
            team: true,
          },
        },
        ownedEquipment: {
          select: { id: true, name: true, serialNumber: true },
        },
        assignedEquipment: {
          select: { id: true, name: true, serialNumber: true },
        },
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json(
      new ApiResponse(200, { user }, 'User retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, departmentId, isActive } = req.body;
    const companyId = req.user.companyId;

    // Check if user exists and belongs to same company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    // Check role permissions
    if (req.user.role === ROLES.MAINTENANCE_MANAGER) {
      // Managers cannot modify Admins or other Managers
      if ([ROLES.ADMIN, ROLES.MAINTENANCE_MANAGER].includes(existingUser.role)) {
        throw ApiError.forbidden('You cannot modify this user');
      }
      // Managers cannot promote to Admin or Manager
      if (role && [ROLES.ADMIN, ROLES.MAINTENANCE_MANAGER].includes(role)) {
        throw ApiError.forbidden('You cannot assign this role');
      }
    }

    // Check email uniqueness if changing
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        throw ApiError.conflict('Email is already in use');
      }
    }

    // Verify department
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, companyId },
      });
      if (!department) {
        throw ApiError.badRequest('Invalid department');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(departmentId !== undefined && { departmentId }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: true,
      },
    });

    res.json(
      new ApiResponse(200, { user: updatedUser }, 'User updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent self-deletion
    if (id === req.user.id) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    // Prevent deleting the last admin
    if (user.role === ROLES.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { companyId, role: ROLES.ADMIN },
      });
      if (adminCount <= 1) {
        throw ApiError.badRequest('Cannot delete the last admin of the company');
      }
    }

    // Check permissions
    if (req.user.role === ROLES.MAINTENANCE_MANAGER) {
      if ([ROLES.ADMIN, ROLES.MAINTENANCE_MANAGER].includes(user.role)) {
        throw ApiError.forbidden('You cannot delete this user');
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'User deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get technicians (for assignment dropdowns)
 * GET /api/users/technicians
 */
const getTechnicians = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { teamId } = req.query;

    let where = {
      companyId,
      role: { in: [ROLES.TECHNICIAN, ROLES.MAINTENANCE_MANAGER] },
      isActive: true,
    };

    // If teamId provided, filter by team membership
    if (teamId) {
      where = {
        ...where,
        teamMemberships: {
          some: { teamId },
        },
      };
    }

    const technicians = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        teamMemberships: {
          select: {
            team: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(
      new ApiResponse(200, { technicians }, 'Technicians retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user stats (for dashboard)
 * GET /api/users/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [totalUsers, byRole, activeUsers] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { companyId },
        _count: true,
      }),
      prisma.user.count({ where: { companyId, isActive: true } }),
    ]);

    const roleStats = byRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {});

    res.json(
      new ApiResponse(200, {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: roleStats,
      }, 'User stats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTechnicians,
  getUserStats,
};
