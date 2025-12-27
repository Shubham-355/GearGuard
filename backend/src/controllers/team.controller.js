const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, formatPaginationResponse } = require('../utils/helpers');
const { ROLES } = require('../config/constants');

/**
 * Create maintenance team
 * POST /api/teams
 */
const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const companyId = req.user.companyId;

    const team = await prisma.maintenanceTeam.create({
      data: {
        name,
        description,
        companyId,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: {
          select: { equipment: true, maintenanceRequests: true },
        },
      },
    });

    res.status(201).json(
      new ApiResponse(201, { team }, 'Team created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all teams
 * GET /api/teams
 */
const getTeams = async (req, res, next) => {
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

    const [teams, total] = await Promise.all([
      prisma.maintenanceTeam.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
            },
          },
          _count: {
            select: { equipment: true, maintenanceRequests: true },
          },
        },
      }),
      prisma.maintenanceTeam.count({ where }),
    ]);

    res.json(
      new ApiResponse(200, formatPaginationResponse(teams, total, pageNum, limitNum), 'Teams retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get team by ID
 * GET /api/teams/:id
 */
const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const team = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                _count: {
                  select: { assignedRequests: true },
                },
              },
            },
          },
        },
        equipment: {
          select: { id: true, name: true, serialNumber: true, status: true },
        },
        _count: {
          select: { equipment: true, maintenanceRequests: true },
        },
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Get active requests for team
    const activeRequests = await prisma.maintenanceRequest.count({
      where: {
        teamId: id,
        stage: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    res.json(
      new ApiResponse(200, {
        team: {
          ...team,
          activeRequests,
        },
      }, 'Team retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update team
 * PUT /api/teams/:id
 */
const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const companyId = req.user.companyId;

    const existingTeam = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
    });

    if (!existingTeam) {
      throw ApiError.notFound('Team not found');
    }

    const team = await prisma.maintenanceTeam.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    res.json(
      new ApiResponse(200, { team }, 'Team updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete team
 * DELETE /api/teams/:id
 */
const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const team = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { equipment: true, maintenanceRequests: true },
        },
      },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Check for active assignments
    if (team._count.equipment > 0) {
      throw ApiError.badRequest('Cannot delete team with assigned equipment');
    }

    const activeRequests = await prisma.maintenanceRequest.count({
      where: {
        teamId: id,
        stage: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    if (activeRequests > 0) {
      throw ApiError.badRequest('Cannot delete team with active requests');
    }

    await prisma.maintenanceTeam.delete({
      where: { id },
    });

    res.json(
      new ApiResponse(200, null, 'Team deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add member to team
 * POST /api/teams/:id/members
 */
const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, isLead } = req.body;
    const companyId = req.user.companyId;

    // Verify team exists
    const team = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Verify user exists and belongs to company
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: { in: [ROLES.TECHNICIAN, ROLES.MAINTENANCE_MANAGER] },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid user or user cannot be added to team');
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: { userId, teamId: id },
    });

    if (existingMember) {
      throw ApiError.conflict('User is already a team member');
    }

    const member = await prisma.teamMember.create({
      data: {
        userId,
        teamId: id,
        isLead: isLead || false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(
      new ApiResponse(201, { member }, 'Member added successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 */
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const companyId = req.user.companyId;

    // Verify team exists
    const team = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Check if member exists
    const member = await prisma.teamMember.findFirst({
      where: { userId, teamId: id },
    });

    if (!member) {
      throw ApiError.notFound('Member not found in team');
    }

    // Check for active requests assigned to this technician for this team
    const activeRequests = await prisma.maintenanceRequest.count({
      where: {
        teamId: id,
        technicianId: userId,
        stage: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    if (activeRequests > 0) {
      throw ApiError.badRequest('Cannot remove member with active requests');
    }

    await prisma.teamMember.delete({
      where: { id: member.id },
    });

    res.json(
      new ApiResponse(200, null, 'Member removed successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update member role (lead status)
 * PATCH /api/teams/:id/members/:userId
 */
const updateMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { isLead } = req.body;
    const companyId = req.user.companyId;

    // Verify team exists
    const team = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    // Find member
    const member = await prisma.teamMember.findFirst({
      where: { userId, teamId: id },
    });

    if (!member) {
      throw ApiError.notFound('Member not found in team');
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: member.id },
      data: { isLead },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true } },
      },
    });

    res.json(
      new ApiResponse(200, { member: updatedMember }, 'Member updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get team members
 * GET /api/teams/:id/members
 */
const getTeamMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Verify team exists
    const team = await prisma.maintenanceTeam.findFirst({
      where: { id, companyId },
    });

    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            _count: {
              select: {
                assignedRequests: {
                  where: { teamId: id },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { isLead: 'desc' },
        { joinedAt: 'asc' },
      ],
    });

    res.json(
      new ApiResponse(200, { members }, 'Team members retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get team stats
 * GET /api/teams/stats
 */
const getTeamStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const teams = await prisma.maintenanceTeam.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            members: true,
            equipment: true,
            maintenanceRequests: true,
          },
        },
      },
    });

    // Get active requests per team
    const teamStats = await Promise.all(
      teams.map(async (team) => {
        const activeRequests = await prisma.maintenanceRequest.count({
          where: {
            teamId: team.id,
            stage: { in: ['NEW', 'IN_PROGRESS'] },
          },
        });

        const completedRequests = await prisma.maintenanceRequest.count({
          where: {
            teamId: team.id,
            stage: 'REPAIRED',
          },
        });

        return {
          id: team.id,
          name: team.name,
          memberCount: team._count.members,
          equipmentCount: team._count.equipment,
          totalRequests: team._count.maintenanceRequests,
          activeRequests,
          completedRequests,
        };
      })
    );

    res.json(
      new ApiResponse(200, { teams: teamStats }, 'Team stats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  updateMember,
  getTeamMembers,
  getTeamStats,
};
