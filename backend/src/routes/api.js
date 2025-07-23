const express = require('express');
const RegistrationController = require('../controllers/registrationController');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Registration endpoints
router.post('/registrations', RegistrationController.createRegistration);
router.get('/registrations', RegistrationController.getAllRegistrations);
router.get('/statistics', RegistrationController.getStatistics);

// Database test endpoint
router.get('/test-db', async (req, res) => {
    try {
        const { testConnection } = require('../config/database');
        const isConnected = await testConnection();
        
        if (isConnected) {
            res.json({
                success: true,
                message: 'Database connection successful',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Environment info endpoint (for debugging)
router.get('/env-info', (req, res) => {
    res.json({
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        dbHost: process.env.DB_HOST ? 'Configured' : 'Not configured',
        dbUser: process.env.DB_USER ? 'Configured' : 'Not configured',
        dbName: process.env.DB_NAME,
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 