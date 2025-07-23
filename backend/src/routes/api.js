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

// Admin endpoints for Google Sheets
router.post('/sync-google-sheets', RegistrationController.syncToGoogleSheets);
router.get('/google-sheets-status', RegistrationController.getGoogleSheetsStatus);

// Test endpoint to manually test Google Sheets
router.post('/test-google-sheets', async (req, res) => {
    try {
        const googleSheetsService = require('../services/googleSheetsService');
        
        if (!googleSheetsService.isReady()) {
            return res.status(503).json({
                success: false,
                message: 'Google Sheets service not ready',
                config: googleSheetsService.getConfig()
            });
        }

        // Test data
        const testData = {
            id: Date.now(),
            created_at: new Date().toLocaleString('vi-VN'),
            full_name: 'Test User',
            phone: '0123456789',
            cccd: '123456789012',
            gender: 'Nam',
            birth_date: '01/01/1990',
            address: 'Test Address',
            factory: 'Vân Trung',
            cccd_issue_date: '01/01/2020',
            cccd_expiry_date: '01/01/2030'
        };

        // Try to add test data
        const result = await googleSheetsService.addRegistration(testData);
        
        res.json({
            success: result.success,
            message: result.success ? 'Test data added successfully' : 'Failed to add test data',
            result: result,
            config: googleSheetsService.getConfig()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error.message
        });
    }
});

module.exports = router; 