# 🏢 Complete Attendance Management System

## 📱 **Flutter App + 🌐 Web Panel + 🔧 Backend API**

### ✅ **Features Implemented:**
- **Location-based Attendance** (200m radius check)
- **Real-time Notifications** with database storage
- **OTP Authentication** for Admin/HR/Manager
- **Role-based Access Control**
- **Professional UI** with notification bells
- **Comprehensive Analytics & Reporting**
- **JWT Token Authentication**
- **File-based Database** (no MySQL dependency)

---

## 🚀 **Quick Start Guide**

### **1. Backend Server (Port 3001)**
```bash
cd backend
npm install
npm start
```
**Server will run on:** `http://localhost:3001`

### **2. Web Panel (Port 8080)**
```bash
cd web_panel
python3 -m http.server 8080
```
**Web Panel URL:** `http://localhost:8080`

### **3. Flutter App**
```bash
cd flutter_app
flutter pub get
flutter run
```

---

## 👥 **Demo Credentials**

| Role | Username | Password |
|------|----------|----------|
| **Admin** | admin | admin123 |
| **HR** | hr001 | hr123 |
| **Manager** | mgr001 | mgr123 |
| **Employee** | emp001 | emp123 |

---

## 🔐 **OTP System**

**For Admin/HR/Manager login:**
1. Enter username/password
2. **OTP will be displayed in backend console/terminal**
3. Copy OTP from terminal and enter in web interface
4. Access granted to respective dashboard

**Demo OTP Location:** Check the backend terminal where `npm start` is running

---

## 📱 **Flutter App Features**

- **Employee Login** (direct access, no OTP)
- **Location-based Punch In/Out**
- **Real-time GPS validation**
- **Attendance History**
- **Push Notifications**
- **Professional Material Design UI**

---

## 🌐 **Web Panel Features**

### **Admin Dashboard** (`/admin.html`)
- Add new employees
- View all users
- Complete attendance records
- System analytics
- User management

### **HR Dashboard** (`/hr.html`)
- Employee attendance reports
- HR analytics
- Team overview

### **Manager Dashboard** (`/manager.html`)
- Team attendance monitoring
- Performance metrics
- Weekly/Monthly reports

---

## 🔧 **Technical Stack**

### **Backend:**
- Node.js + Express
- JWT Authentication
- File-based JSON storage
- Location validation with Geolib
- Email service ready (Nodemailer)

### **Flutter App:**
- Material Design
- HTTP requests
- Geolocator for GPS
- Local notifications
- Shared preferences

### **Web Panel:**
- Pure HTML/CSS/JavaScript
- Responsive design
- Real-time API integration
- Role-based routing

---

## 📍 **Office Location Settings**

**Default Office Coordinates:**
- **Latitude:** 28.6139 (New Delhi)
- **Longitude:** 77.2090
- **Allowed Radius:** 200 meters

**To change office location:**
Edit `OFFICE_LOCATION` in `backend/server.js`

---

## 🔄 **API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User login |
| POST | `/api/verify-otp` | OTP verification |
| POST | `/api/punch-in` | Location-based punch in |
| POST | `/api/punch-out` | Location-based punch out |
| GET | `/api/attendance/:userId` | User attendance |
| GET | `/api/attendance` | All attendance (admin) |
| GET | `/api/analytics` | System analytics |
| POST | `/api/users` | Add new user |
| GET | `/api/users` | Get all users |

---

## 🎯 **How to Test**

### **1. Start Backend**
```bash
cd backend && npm start
```

### **2. Start Web Panel**
```bash
cd web_panel && python3 -m http.server 8080
```

### **3. Test Web Login**
1. Go to `http://localhost:8080`
2. Login as **admin/admin123**
3. Check terminal for OTP
4. Enter OTP and access admin dashboard

### **4. Test Flutter App**
1. Run `flutter run` in flutter_app directory
2. Login as **emp001/emp123**
3. Test location-based attendance

---

## 📊 **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Flutter App   │    │   Web Panel     │    │   Backend API   │
│   (Employee)    │◄──►│ (Admin/HR/Mgr)  │◄──►│   (Node.js)     │
│   Port: Mobile  │    │   Port: 8080    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │   JSON Database │
                                               │   (data.json)   │
                                               └─────────────────┘
```

---

## 🔧 **Production Deployment**

### **Backend:**
- Deploy to Heroku/Railway/Render
- Add real email service credentials
- Use proper database (MongoDB/PostgreSQL)
- Add environment variables

### **Web Panel:**
- Deploy to Netlify/Vercel
- Update API URLs to production
- Add SSL certificates

### **Flutter App:**
- Build APK: `flutter build apk`
- Update API URLs to production
- Add proper app signing

---

## 🛡️ **Security Features**

- **JWT Token Authentication**
- **OTP-based 2FA** for privileged users
- **Location Validation** (GPS spoofing protection)
- **Role-based Access Control**
- **CORS Protection**
- **Input Validation**
- **Secure Headers**

---

## 📞 **Support**

**System Status:** ✅ Fully Functional
**Demo Ready:** ✅ Yes
**Production Ready:** ⚠️ Needs email service setup

**Next Steps:**
1. Configure real email service for OTP
2. Add proper database
3. Deploy to production servers
4. Add more advanced features

---

**🎉 Complete Attendance System Ready for Demo!**