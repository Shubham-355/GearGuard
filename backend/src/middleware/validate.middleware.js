const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware
 * Checks for validation errors and returns them
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    
    return next(ApiError.badRequest('Validation failed', formattedErrors));
  }
  
  next();
};

module.exports = validate;
