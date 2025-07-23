-- Luxshare Interview Registration Database Schema
-- Created for Google Cloud SQL

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS luxshare_db;
USE luxshare_db;

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL COMMENT 'Họ và tên',
    phone VARCHAR(15) NOT NULL COMMENT 'Số điện thoại',
    cccd VARCHAR(20) NOT NULL COMMENT 'Số CCCD',
    gender ENUM('Nam', 'Nữ') NOT NULL COMMENT 'Giới tính',
    birth_date VARCHAR(10) NOT NULL COMMENT 'Ngày sinh (mm/dd/yyyy)',
    address TEXT NOT NULL COMMENT 'Địa chỉ thường trú',
    cccd_issue_date VARCHAR(10) NULL COMMENT 'Ngày cấp CCCD (mm/dd/yyyy)',
    cccd_expiry_date VARCHAR(10) NULL COMMENT 'Ngày hết hạn CCCD (mm/dd/yyyy)',
    factory VARCHAR(100) NOT NULL COMMENT 'Nhà xưởng ứng tuyển',
    ip_address VARCHAR(45) NULL COMMENT 'IP address của người đăng ký',
    user_agent TEXT NULL COMMENT 'User agent của browser',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
    
    -- Indexes for better performance
    INDEX idx_phone (phone),
    INDEX idx_cccd (cccd),
    INDEX idx_factory (factory),
    INDEX idx_created_at (created_at),
    
    -- Unique constraints
    UNIQUE KEY unique_phone (phone),
    UNIQUE KEY unique_cccd (cccd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thông tin đăng ký phỏng vấn';

-- Create admin users table (for future admin panel)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quản lý admin users';

-- Create audit log table (for tracking changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL COMMENT 'Tên bảng được thay đổi',
    record_id INT NOT NULL COMMENT 'ID của record được thay đổi',
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL COMMENT 'Hành động thực hiện',
    old_values JSON NULL COMMENT 'Giá trị cũ (cho UPDATE/DELETE)',
    new_values JSON NULL COMMENT 'Giá trị mới (cho INSERT/UPDATE)',
    user_id INT NULL COMMENT 'ID của user thực hiện (nếu có)',
    ip_address VARCHAR(45) NULL COMMENT 'IP address',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng audit log';

-- Insert sample admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash, role) VALUES 
('admin', 'admin@luxshare.com', '$2b$10$rQZ8K9mN2pL1vX3yU7wE4t', 'admin')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create views for easier data access
CREATE OR REPLACE VIEW registration_summary AS
SELECT 
    factory,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN gender = 'Nam' THEN 1 END) as male_count,
    COUNT(CASE WHEN gender = 'Nữ' THEN 1 END) as female_count,
    DATE(created_at) as registration_date
FROM registrations 
GROUP BY factory, DATE(created_at)
ORDER BY registration_date DESC, factory;

-- Create view for recent registrations
CREATE OR REPLACE VIEW recent_registrations AS
SELECT 
    id,
    full_name,
    phone,
    factory,
    created_at,
    TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_ago
FROM registrations 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- Show table structure
DESCRIBE registrations;
DESCRIBE admin_users;
DESCRIBE audit_logs;

-- Show sample data
SELECT 'Database setup completed successfully!' as status; 