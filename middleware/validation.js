const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach(error => {
      fieldErrors[error.path] = error.msg;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          fields: fieldErrors
        }
      }
    });
  }
  
  next();
};

module.exports = { validate };