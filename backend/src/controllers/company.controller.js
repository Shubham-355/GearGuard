const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get company information
 * GET /api/company
 */
const getCompany = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        id: true,
        name: true,
        allowedDomains: true,
        inviteCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    res.json(new ApiResponse(200, company, 'Company retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update allowed domains (Admin only)
 * PUT /api/company/allowed-domains
 */
const updateAllowedDomains = async (req, res, next) => {
  try {
    const { allowedDomains } = req.body;

    // Validate that domains array is not empty
    if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) {
      throw ApiError.badRequest('At least one domain is required');
    }

    // Validate domain format
    const domainRegex = /^@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    
    for (const domain of allowedDomains) {
      if (!domainRegex.test(domain)) {
        throw ApiError.badRequest(`Invalid domain format: ${domain}`);
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: req.user.companyId },
      data: { allowedDomains },
      select: {
        id: true,
        name: true,
        allowedDomains: true,
        updatedAt: true,
      },
    });

    res.json(
      new ApiResponse(200, updatedCompany, 'Allowed domains updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompany,
  updateAllowedDomains,
};
