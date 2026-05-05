const slugify = require('slugify');
const logger = require('./logger');

/**
 * Slugify problem title for folder structure
 */
const slugifyTitle = (title) => {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const waitTime = delay * Math.pow(2, i);
      logger.warn(`Retry attempt ${i + 1}/${maxRetries} after ${waitTime}ms`);
      await sleep(waitTime);
    }
  }
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sanitize input to prevent injection
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
};

module.exports = {
  slugifyTitle,
  retryWithBackoff,
  sleep,
  sanitizeInput
};
