const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const IV_LENGTH = 16;

/**
 * Encrypt API key (optional - for temporary storage)
 */
const encryptApiKey = (apiKey) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    logger.error(`Encryption error: ${error.message}`);
    throw error;
  }
};

/**
 * Decrypt API key
 */
const decryptApiKey = (encryptedApiKey) => {
  try {
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  encryptApiKey,
  decryptApiKey
};
