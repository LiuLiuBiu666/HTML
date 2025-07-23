# Luxshare Interview Registration - Project Structure

## 📁 Tổng quan cấu trúc project

```
luxshare-project/
├── frontend/
│   └── luxshare-interview-site.html    # Frontend file (có thể deploy riêng)
├── backend/                            # Backend project (tách riêng)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js            # Database configuration
│   │   ├── controllers/
│   │   │   └── registrationController.js  # Business logic
│   │   ├── routes/
│   │   │   └── api.js                 # API routes
│   │   ├── middleware/
│   │   │   ├── validation.js          # Input validation
│   │   │   └── errorHandler.js        # Error handling
│   │   └── utils/
│   │       └── emailService.js        # Email service
│   ├── public/
│   │   └── luxshare-interview-site.html  # Frontend file
│   ├── database/
│   │   └── schema.sql                 # Database schema
│   ├── scripts/
│   │   ├── deploy.sh                  # Auto deploy script
│   │   ├── migrate.sh                 # Migration script
│   │   └── setup-db.sh                # Database setup
│   ├── api-server.js                  # Main server file
│   ├── package.json                   # Node.js dependencies
│   └── README.md                      # Backend documentation
└── README.md                          # Project overview
```

## 🚀 Cách sử dụng

### **1. Deploy Backend lên Google Cloud**

```bash
# Clone hoặc copy backend folder
cd backend

# Cấu hình environment variables
cp .env.example .env
# Chỉnh sửa .env với thông tin database

# Deploy tự động
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### **2. Chuyển đổi Google Cloud Account**

```bash
# Migration toàn bộ sang account mới
chmod +x scripts/migrate.sh
./scripts/migrate.sh migrate

# Hoặc chỉ backup data
./scripts/migrate.sh backup

# Hoặc chỉ restore data
./scripts/migrate.sh restore
```

### **3. Cập nhật Frontend**

Sau khi deploy backend, cập nhật URL API trong file `luxshare-interview-site.html`:

```javascript
// Thay đổi URL này thành IP của VM mới
const apiUrl = 'http://YOUR_NEW_VM_IP:3000/api/registrations';
```

## 🔧 Cấu hình Database

### **Google Cloud SQL Setup**

```bash
# 1. Tạo Cloud SQL instance
gcloud sql instances create luxshare-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=asia-southeast1

# 2. Tạo database
gcloud sql databases create luxshare_db --instance=luxshare-db

# 3. Tạo user
gcloud sql users create luxshare_user \
    --instance=luxshare-db \
    --password=your-password

# 4. Setup schema
mysql -h YOUR_CLOUD_SQL_IP -u luxshare_user -p luxshare_db < database/schema.sql
```

### **Environment Variables (.env)**

```env
# Database Configuration
DB_HOST=your-cloud-sql-ip
DB_USER=luxshare_user
DB_PASSWORD=your-password
DB_NAME=luxshare_db

# Server Configuration
PORT=3000
NODE_ENV=production
```

## 📊 API Endpoints

### **POST /api/registrations**
- **Mô tả**: Đăng ký phỏng vấn mới
- **Request**: JSON với thông tin đăng ký
- **Response**: Success/Error message

### **GET /api/registrations**
- **Mô tả**: Lấy danh sách đăng ký (Admin)
- **Response**: Array of registrations

### **GET /api/statistics**
- **Mô tả**: Thống kê đăng ký
- **Response**: Statistics data

### **GET /api/health**
- **Mô tả**: Health check
- **Response**: Server status

### **GET /api/test-db**
- **Mô tả**: Test database connection
- **Response**: Database status

## 🔄 Migration Process

### **Từ Account Cũ sang Account Mới**

1. **Backup Data**
   ```bash
   mysqldump -h OLD_IP -u OLD_USER -p OLD_DB > backup.sql
   ```

2. **Setup Account Mới**
   ```bash
   # Tạo project mới
   gcloud projects create new-project-id
   
   # Setup VM và Cloud SQL
   ./scripts/deploy.sh
   ```

3. **Restore Data**
   ```bash
   mysql -h NEW_IP -u NEW_USER -p NEW_DB < backup.sql
   ```

4. **Update Configuration**
   ```bash
   # Chỉnh sửa .env file
   DB_HOST=NEW_IP
   DB_USER=NEW_USER
   DB_PASSWORD=NEW_PASSWORD
   ```

5. **Redeploy Application**
   ```bash
   ./scripts/deploy.sh
   ```

## 💰 Chi phí ước tính

### **Google Cloud Services**
- **Compute Engine (e2-micro)**: $5-10/tháng
- **Cloud SQL (db-f1-micro)**: $10-15/tháng
- **Cloud Storage (tùy chọn)**: $1-5/tháng
- **Tổng cộng**: $15-30/tháng

### **Domain & SSL**
- **Domain**: $10-15/năm
- **SSL Certificate**: Miễn phí (Let's Encrypt)

## 🔒 Security Features

- ✅ **Input Validation**: Kiểm tra dữ liệu đầu vào
- ✅ **SQL Injection Prevention**: Sử dụng prepared statements
- ✅ **CORS Configuration**: Cấu hình cross-origin
- ✅ **IP Logging**: Ghi log IP address
- ✅ **Duplicate Prevention**: Ngăn đăng ký trùng lặp

## 📈 Monitoring & Maintenance

### **Health Checks**
```bash
# Kiểm tra server
curl http://YOUR_IP/api/health

# Kiểm tra database
curl http://YOUR_IP/api/test-db

# Xem logs
pm2 logs luxshare-api
```

### **Backup Strategy**
- **Database**: Automated daily backups
- **Code**: Version control với Git
- **Configuration**: Backup .env files

### **Scaling Options**
- **Vertical**: Tăng VM specs
- **Horizontal**: Load balancer + multiple VMs
- **Database**: Cloud SQL với high availability

## 🆘 Troubleshooting

### **Common Issues**

1. **Database Connection Failed**
   - Kiểm tra firewall rules
   - Verify database credentials
   - Check Cloud SQL instance status

2. **Application Not Starting**
   - Check PM2 logs: `pm2 logs luxshare-api`
   - Verify Node.js version: `node --version`
   - Check port availability: `netstat -tulpn | grep 3000`

3. **Form Submission Fails**
   - Check API endpoint: `curl -X POST http://YOUR_IP/api/registrations`
   - Verify CORS configuration
   - Check browser console for errors

### **Useful Commands**

```bash
# SSH to VM
gcloud compute ssh luxshare-server --zone=asia-southeast1-a

# View application logs
pm2 logs luxshare-api

# Restart application
pm2 restart luxshare-api

# Check database connection
mysql -h YOUR_DB_IP -u YOUR_USER -p

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
```

## 📞 Support

- **Documentation**: README.md trong mỗi folder
- **API Testing**: Use Postman hoặc curl
- **Monitoring**: Google Cloud Console
- **Logs**: PM2 logs và Nginx logs 