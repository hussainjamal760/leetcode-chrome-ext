const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const validateRequest = require('../middlewares/validateRequest');

// POST /api/sync - Main sync endpoint
router.post('/sync', validateRequest, syncController.syncSolution);

// GET /api/validate - Validate configuration
router.get('/validate', syncController.validateConfig);

module.exports = router;
