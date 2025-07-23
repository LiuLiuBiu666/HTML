const { getConnection } = require('../config/database');

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
}

module.exports = RegistrationController; 