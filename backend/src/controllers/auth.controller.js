const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateInviteCode, extractEmailDomain, isDomainAllowed } = require('../utils/helpers');
const { ROLES, JWT } = require('../config/constants');
const { sendEmail } = require('../config/email');

/**
 * Register a new company with admin
 * POST /api/auth/register-company
 */
const registerCompany = async (req, res, next) => {
  try {
    const { companyName, allowedDomains, adminName, adminEmail, adminPassword } = req.body;

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Generate invite code
    const inviteCode = generateInviteCode(companyName);

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create company and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          allowedDomains,
          inviteCode,
        },
      });

      // Create admin user
      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: ROLES.ADMIN,
          companyId: company.id,
        },
      });

      return { company, admin };
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.admin.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT.EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = result.admin;

    // Send welcome email to admin
    sendEmail(result.admin.email, 'companyRegistered', [result.admin, result.company]);

    res.status(201).json(
      new ApiResponse(201, {
        user: adminWithoutPassword,
        company: result.company,
        token,
      }, 'Company registered successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Employee signup with domain auto-join
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Extract domain and find matching company
    const domain = extractEmailDomain(email);
    if (!domain) {
      throw ApiError.badRequest('Invalid email format');
    }

    const company = await prisma.company.findFirst({
      where: {
        allowedDomains: {
          has: domain,
        },
      },
    });

    if (!company) {
      throw ApiError.badRequest(
        'No company found for this email domain. Please use an invite code or contact your administrator.'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: ROLES.EMPLOYEE,
        companyId: company.id,
      },
      include: {
        company: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT.EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Send welcome email
    sendEmail(user.email, 'welcome', [user, company]);

    res.status(201).json(
      new ApiResponse(201, {
        user: userWithoutPassword,
        token,
      }, 'Signup successful')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Signup with invite code
 * POST /api/auth/signup-with-invite
 */
const signupWithInvite = async (req, res, next) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Find company by invite code
    const company = await prisma.company.findUnique({
      where: { inviteCode },
    });

    if (!company) {
      throw ApiError.badRequest('Invalid invite code');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: ROLES.EMPLOYEE,
        companyId: company.id,
      },
      include: {
        company: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT.EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Send welcome email
    sendEmail(user.email, 'welcome', [user, company]);

    res.status(201).json(
      new ApiResponse(201, {
        user: userWithoutPassword,
        token,
      }, 'Signup successful')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with company
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        department: true,
        teamMemberships: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.unauthorized('Your account has been deactivated. Please contact your administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT.EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json(
      new ApiResponse(200, {
        user: userWithoutPassword,
        token,
      }, 'Login successful')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;

    res.json(
      new ApiResponse(200, {
        user: userWithoutPassword,
      }, 'Profile retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, req.user.password);

    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json(
      new ApiResponse(200, null, 'Password changed successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      include: {
        company: true,
        department: true,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(
      new ApiResponse(200, {
        user: userWithoutPassword,
      }, 'Profile updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get company invite code (Admin only)
 * GET /api/auth/invite-code
 */
const getInviteCode = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { inviteCode: true, name: true },
    });

    res.json(
      new ApiResponse(200, {
        inviteCode: company.inviteCode,
        companyName: company.name,
      }, 'Invite code retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate invite code (Admin only)
 * POST /api/auth/regenerate-invite
 */
const regenerateInviteCode = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    const newInviteCode = generateInviteCode(company.name);

    const updatedCompany = await prisma.company.update({
      where: { id: req.user.companyId },
      data: { inviteCode: newInviteCode },
      select: { inviteCode: true, name: true },
    });

    res.json(
      new ApiResponse(200, {
        inviteCode: updatedCompany.inviteCode,
        companyName: updatedCompany.name,
      }, 'Invite code regenerated successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCompany,
  signup,
  signupWithInvite,
  login,
  getMe,
  changePassword,
  updateProfile,
  getInviteCode,
  regenerateInviteCode,
};
