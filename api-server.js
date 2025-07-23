const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection configuration for Google Cloud SQL
const dbConfig = {
    host: process.env.DB_HOST || 'your-cloud-sql-ip',
    user: process.env.DB_USER || 'your-db-user',
    password: process.env.DB_PASSWORD || 'your-db-password',
    database: process.env.DB_NAME || 'luxshare_db',
    ssl: {
        rejectUnauthorized: false
    }
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// API endpoint to handle form submissions
app.post('/api/registrations', async (req, res) => {
    try {
        const {
            fullName,
            phone,
            cccd,
            gender,
            birthDate,
            address,
            cccdIssueDate,
            cccdExpiryDate,
            factory
        } = req.body;

        // Validation
        if (!fullName || !phone || !cccd || !gender || !birthDate || !address || !factory) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Phone number validation (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại phải có 10 chữ số'
            });
        }

        // CCCD validation (12 digits)
        if (!/^\d{12}$/.test(cccd)) {
            return res.status(400).json({
                success: false,
                message: 'Số CCCD phải có 12 chữ số'
            });
        }

        // Insert into database
        const connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO registrations 
            (full_name, phone, cccd, gender, birth_date, address, cccd_issue_date, cccd_expiry_date, factory, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fullName,
                phone,
                cccd,
                gender,
                birthDate,
                address,
                cccdIssueDate || null,
                cccdExpiryDate || null,
                factory,
                req.ip,
                req.get('User-Agent')
            ]
        );

        connection.release();

        // Send email notification (optional)
        // await sendEmailNotification(req.body);

        res.json({
            success: true,
            message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
            registrationId: result.insertId
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
});

// API endpoint to get all registrations (for admin panel)
app.get('/api/registrations', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM registrations ORDER BY created_at DESC'
        );
        connection.release();

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy dữ liệu'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/luxshare-interview-site.html');
});

app.listen(port, () => {
    console.log(`Luxshare API server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
}); 