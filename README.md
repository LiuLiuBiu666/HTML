# 🏭 Luxshare Interview Registration System

Hệ thống đăng ký phỏng vấn trực tuyến cho Công ty TNHH Luxshare ICT Việt Nam với tích hợp Google Sheets tự động.

## 🌟 Tính năng chính

- ✅ **Form đăng ký responsive** - Giao diện mobile-friendly
- 🗄️ **MySQL Database** - Lưu trữ dữ liệu ứng viên
- 📊 **Google Sheets Integration** - Tự động sync dữ liệu
- � **Auto-sync** - Dữ liệu tự động đồng bộ sau khi lưu database
- 📱 **Contact Integration** - Zalo và hotline direct links
- 🧪 **Health Monitoring** - System health check và debugging tools

## 🚀 Demo

- **Frontend Form**: [Live Demo](http://localhost:3000/index.html)
- **System Health**: [Health Check](http://localhost:3000/system-health-check.html)
- **Admin Panel**: [Google Sheets Admin](http://localhost:3000/admin-google-sheets.html)

## 📋 Thông tin form

### Trường bắt buộc:
- Họ và tên
- Số điện thoại
- Số CCCD
- Giới tính
- Ngày sinh
- Địa chỉ thường trú
- Nhà xưởng ứng tuyển

### Trường tùy chọn:
- Ngày cấp CCCD
- Ngày hết hạn CCCD

## 🏢 Các nhà máy

1. **Vân Trung** - KCN Vân Trung, Xã Vân Trung, Huyện Việt Yên, Tỉnh Bắc Giang
2. **Quang Châu 1** - Khu công nghiệp Quang Châu, Xã Quang Châu, Huyện Việt Yên, Tỉnh Bắc Giang
3. **Quang Châu 2** - Khu công nghiệp Quang Châu, Xã Quang Châu, Huyện Việt Yên, Tỉnh Bắc Giang  
4. **Quang Châu 3** - Khu công nghiệp Quang Châu, Xã Quang Châu, Huyện Việt Yên, Tỉnh Bắc Giang

## 📞 Liên hệ

- **Hotline**: 0971902395
- **Email**: developer@luxshare-ict.com
- **Địa chỉ**: Lô E, Khu công nghiệp Quang Châu, Xã Quang Châu, Huyện Việt Yên, Tỉnh Bắc Giang, Việt Nam

## 🛠️ Công nghệ

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Deployment**: Vercel (Frontend), Google Cloud (Backend)

## 📝 Cấu trúc dự án

```
├── index.html              # Website chính
├── vercel.json             # Cấu hình Vercel
├── package.json            # Dependencies
├── backend/                # API Server
│   ├── api-server.js       # Express server
│   ├── package.json        # Backend dependencies
│   ├── database/           # Database schema
│   ├── src/                # Source code
│   └── scripts/            # Deploy scripts
└── README.md              # Tài liệu này
```

## 🚀 Development

1. Clone repository:
   ```bash
   git clone https://github.com/LiuLiuBiu666/HTML.git
   ```

2. Mở `index.html` trong browser để test frontend

3. Chạy backend (optional):
   ```bash
   cd backend
   npm install
   npm start
   ```

## 📄 License

© 2016 Công ty TNHH Luxshare - ICT Việt Nam
