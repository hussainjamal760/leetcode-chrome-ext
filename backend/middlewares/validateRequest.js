const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schema for sync request
const syncSchema = Joi.object({
  problemTitle: Joi.string().required().min(1).max(500),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  code: Joi.string().required().min(1).max(50000),
  language: Joi.string().required().min(1).max(50),
  userApiKey: Joi.string().optional().allow('').max(200),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  problemUrl: Joi.string().uri().optional().allow('')
});

/**
 * Validate incoming request
 */
const validateRequest = (req, res, next) => {
  const { error, value } = syncSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn(`Validation failed: ${JSON.stringify(errors)}`);

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Sanitize input
  req.body = value;
  next();
};

module.exports = validateRequest;
