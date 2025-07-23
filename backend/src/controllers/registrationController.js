const { getConnection } = require('../config/database');
const googleSheetsService = require('../services/googleSheetsService');

class RegistrationController {
    // Create new registration
    static async createRegistration(req, res) {
        let connection;
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

            // Check if phone number already exists
            connection = await getConnection();
            const [existingPhone] = await connection.execute(
                'SELECT id FROM registrations WHERE phone = ?',
                [phone]
            );

            if (existingPhone.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số điện thoại này đã được đăng ký trước đó'
                });
            }

            // Check if CCCD already exists
            const [existingCCCD] = await connection.execute(
                'SELECT id FROM registrations WHERE cccd = ?',
                [cccd]
            );

            if (existingCCCD.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số CCCD này đã được đăng ký trước đó'
                });
            }

            // Insert new registration
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

            // Get the inserted record for Google Sheets sync
            const [insertedRecord] = await connection.execute(
                'SELECT * FROM registrations WHERE id = ?',
                [result.insertId]
            );

            // Auto-sync to Google Sheets (non-blocking)
            if (insertedRecord.length > 0) {
                setImmediate(async () => {
                    try {
                        await googleSheetsService.addRegistration(insertedRecord[0]);
                    } catch (syncError) {
                        console.error('Google Sheets sync error:', syncError.message);
                        // Sync errors don't affect user experience
                    }
                });
            }

            // Send email notification (optional)
            // await sendEmailNotification(req.body);

            res.json({
                success: true,
                message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
                registrationId: result.insertId,
                data: {
                    fullName,
                    phone,
                    factory,
                    registrationDate: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Get all registrations (Admin only)
    static async getAllRegistrations(req, res) {
        let connection;
        try {
            connection = await getConnection();
            
            const [rows] = await connection.execute(
                'SELECT * FROM registrations ORDER BY created_at DESC'
            );

            res.json({
                success: true,
                count: rows.length,
                data: rows
            });
        } catch (error) {
            console.error('Get registrations error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy dữ liệu'
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Get registration statistics
    static async getStatistics(req, res) {
        let connection;
        try {
            connection = await getConnection();
            
            // Total registrations
            const [totalResult] = await connection.execute(
                'SELECT COUNT(*) as total FROM registrations'
            );

            // Registrations by factory
            const [factoryStats] = await connection.execute(
                'SELECT factory, COUNT(*) as count FROM registrations GROUP BY factory'
            );

            // Registrations by gender
            const [genderStats] = await connection.execute(
                'SELECT gender, COUNT(*) as count FROM registrations GROUP BY gender'
            );

            // Recent registrations (last 7 days)
            const [recentStats] = await connection.execute(
                'SELECT COUNT(*) as count FROM registrations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
            );

            res.json({
                success: true,
                data: {
                    total: totalResult[0].total,
                    byFactory: factoryStats,
                    byGender: genderStats,
                    recent7Days: recentStats[0].count
                }
            });
        } catch (error) {
            console.error('Statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy thống kê'
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Sync database to Google Sheets (Admin endpoint)
    static async syncToGoogleSheets(req, res) {
        try {
            if (!googleSheetsService.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'Google Sheets service not configured'
                });
            }

            const result = await googleSheetsService.syncFromDatabase(getConnection);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `Successfully synced ${result.count || 0} registrations to Google Sheets`
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.error || 'Sync failed'
                });
            }
        } catch (error) {
            console.error('Sync to Google Sheets error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi đồng bộ Google Sheets'
            });
        }
    }

    // Get Google Sheets status (Admin endpoint)
    static async getGoogleSheetsStatus(req, res) {
        try {
            const config = googleSheetsService.getConfig();
            const sheetsData = config.initialized ? await googleSheetsService.getRegistrations() : null;

            res.json({
                success: true,
                googleSheets: {
                    ...config,
                    recordCount: sheetsData?.count || 0,
                    lastSync: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Google Sheets status error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi kiểm tra Google Sheets'
            });
        }
    }
}

module.exports = RegistrationController; 