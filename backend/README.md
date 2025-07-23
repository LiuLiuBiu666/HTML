# Luxshare Interview Registration Backend

Backend API cho website đăng ký phỏng vấn Luxshare ICT.

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment variables
```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin database của bạn
```

### 3. Chạy development server
```bash
npm run dev
```

### 4. Chạy production server
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Database configuration
│   │   └── server.js        # Server configuration
│   ├── controllers/
│   │   └── registrationController.js  # Form submission logic
│   ├── models/
│   │   └── Registration.js  # Database model
│   ├── routes/
│   │   └── api.js          # API routes
│   ├── middleware/
│   │   ├── validation.js   # Input validation
│   │   └── errorHandler.js # Error handling
│   └── utils/
│       └── emailService.js # Email service (optional)
├── public/
│   └── luxshare-interview-site.html  # Frontend file
├── database/
│   └── schema.sql          # Database schema
├── scripts/
│   ├── deploy.sh           # Deploy script
│   └── setup-db.sh         # Database setup script
├── api-server.js           # Main server file
├── package.json
└── .env.example
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database Configuration
DB_HOST=your-cloud-sql-ip
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=luxshare_db

# Server Configuration
PORT=3000
NODE_ENV=production

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🗄️ Database Setup

### 1. Tạo database schema
```bash
# Kết nối vào Cloud SQL
mysql -h YOUR_CLOUD_SQL_IP -u YOUR_USER -p YOUR_DATABASE

# Chạy schema
source database/schema.sql
```

### 2. Hoặc sử dụng script
```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

## 🚀 Deploy to Google Cloud

### Option 1: Manual Deploy
```bash
# 1. SSH vào VM
gcloud compute ssh YOUR_VM_NAME --zone=YOUR_ZONE

# 2. Upload code
gcloud compute scp --recurse ./backend YOUR_VM_NAME:~/ --zone=YOUR_ZONE

# 3. Setup và chạy
cd backend
npm install
npm start
```

### Option 2: Auto Deploy Script
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📊 API Endpoints

### POST /api/registrations
Đăng ký phỏng vấn mới

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "cccd": "123456789012",
  "gender": "Nam",
  "birthDate": "01/01/1990",
  "address": "Hà Nội",
  "cccdIssueDate": "01/01/2020",
  "cccdExpiryDate": "01/01/2030",
  "factory": "Vân Trung"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công!",
  "registrationId": 123
}
```

### GET /api/registrations
Lấy danh sách đăng ký (Admin only)

### GET /api/health
Health check endpoint

## 🔒 Security

- Input validation
- SQL injection prevention
- CORS configuration
- Rate limiting (optional)
- IP logging

## 📈 Monitoring

- Health check endpoint
- Error logging
- Performance monitoring
- Database connection monitoring

## 🔄 Migration

Để chuyển sang Google Cloud account khác:

1. **Export data từ account cũ:**
```bash
mysqldump -h OLD_CLOUD_SQL_IP -u OLD_USER -p OLD_DATABASE > backup.sql
```

2. **Setup account mới:**
```bash
# Tạo Cloud SQL instance mới
gcloud sql instances create luxshare-db-new --database-version=MYSQL_8_0 --tier=db-f1-micro --region=asia-southeast1

# Import data
mysql -h NEW_CLOUD_SQL_IP -u NEW_USER -p NEW_DATABASE < backup.sql
```

3. **Update environment variables:**
```bash
# Chỉnh sửa .env file
DB_HOST=NEW_CLOUD_SQL_IP
DB_USER=NEW_USER
DB_PASSWORD=NEW_PASSWORD
```

4. **Redeploy:**
```bash
./scripts/deploy.sh
```

## 📞 Support

Liên hệ: [Your Contact Info] 