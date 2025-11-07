const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const geolib = require('geolib');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = 'attendance_secret_key';

// Office location (user's actual coordinates)
const OFFICE_LOCATION = {
  latitude: 28.460315,
  longitude: 77.0336622
};
const ALLOWED_RADIUS = 200; // meters

app.use(cors({
  origin: ['https://attendance-system-xiks.onrender.com', 'https://attendance-system-complete.onrender.com', 'http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:9000', 'http://127.0.0.1:9000', 'http://localhost:9001', 'http://127.0.0.1:9001', 'file://', 'null'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('../web_panel'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3002 http://127.0.0.1:3002 http://localhost:8080 http://localhost:9000; connect-src 'self' http://localhost:3002 http://127.0.0.1:3002 http://localhost:8080 http://localhost:9000");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// File-based storage
const dataFile = 'data.json';

// Initialize data
if (!fs.existsSync(dataFile)) {
  const initialData = {
    users: [
      { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), name: 'Admin User', role: 'admin', email: 'admin@company.com' },
      { id: 2, username: 'hr001', password: bcrypt.hashSync('hr123', 10), name: 'HR Manager', role: 'hr', email: 'hr@company.com' },
      { id: 3, username: 'mgr001', password: bcrypt.hashSync('mgr123', 10), name: 'Team Manager', role: 'manager', email: 'manager@company.com' },
      { id: 4, username: 'emp001', password: bcrypt.hashSync('emp123', 10), name: 'John Doe', role: 'employee', email: 'john@company.com' }
    ],
    attendance: [],
    notifications: [],
    otpStore: {},
    nextId: 5
  };
  fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
}

// Login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  
  const user = data.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // For admin/hr/manager, send OTP
  if (['admin', 'hr', 'manager'].includes(user.role)) {
    const otp = generateOTP();
    data.otpStore[user.id] = { otp, expires: Date.now() + 300000 }; // 5 minutes
    writeData(data);
    
    // Send OTP email (mock for now)
    console.log(`OTP for ${user.name}: ${otp}`);
    
    // For demo purposes, show OTP in response (remove in production)
    console.log(`\n🔐 DEMO OTP: ${otp} for ${user.name}\n`);
    
    return res.json({ 
      requiresOTP: true, 
      userId: user.id,
      message: 'OTP sent to your email' 
    });
  }
  
  // For employees, direct login
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  });
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { userId, otp } = req.body;
  const data = readData();
  
  const storedOTP = data.otpStore[userId];
  if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }
  
  const user = data.users.find(u => u.id === userId);
  delete data.otpStore[userId];
  writeData(data);
  
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  });
});

// Check location and punch in
app.post('/api/punch-in', verifyToken, (req, res) => {
  const { latitude, longitude } = req.body;
  const data = readData();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes from midnight
  
  // Check if already punched in
  const existing = data.attendance.find(a => a.userId === req.userId && a.date === today);
  if (existing) {
    return res.status(400).json({ error: 'Already punched in today' });
  }
  
  // Rule 1: Punch in only after 9:00 AM
  if (currentTime < 540) { // 9:00 AM = 540 minutes
    return res.status(400).json({ error: 'Punch in allowed only after 9:00 AM' });
  }
  
  // Check location
  const distance = geolib.getDistance(
    { latitude, longitude },
    OFFICE_LOCATION
  );
  
  if (distance > ALLOWED_RADIUS) {
    return res.status(400).json({ 
      error: `You are ${distance}m away from office. Must be within ${ALLOWED_RADIUS}m` 
    });
  }
  
  // Determine status based on punch in time
  let status = 'present';
  if (currentTime > 610) { // After 10:10 AM
    status = 'half_day'; // Late arrival
  }
  
  // Record attendance
  const attendanceRecord = {
    id: Date.now(),
    userId: req.userId,
    date: today,
    punchIn: new Date().toISOString(),
    punchOut: null,
    location: { latitude, longitude },
    distance,
    status
  };
  
  data.attendance.push(attendanceRecord);
  
  // Add notification
  const message = status === 'half_day' ? 'Punched in successfully (Late arrival - Half day)' : 'Punched in successfully';
  data.notifications.push({
    id: Date.now(),
    userId: req.userId,
    message,
    type: 'punch_in',
    timestamp: new Date().toISOString(),
    read: false
  });
  
  writeData(data);
  res.json({ success: true, message, distance, status });
});

// Punch out
app.post('/api/punch-out', verifyToken, (req, res) => {
  const { latitude, longitude } = req.body;
  const data = readData();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const record = data.attendance.find(a => 
    a.userId === req.userId && a.date === today && !a.punchOut
  );
  
  if (!record) {
    return res.status(400).json({ error: 'No punch in record found' });
  }
  
  // Check location
  const distance = geolib.getDistance(
    { latitude, longitude },
    OFFICE_LOCATION
  );
  
  if (distance > ALLOWED_RADIUS) {
    return res.status(400).json({ 
      error: `You are ${distance}m away from office. Must be within ${ALLOWED_RADIUS}m` 
    });
  }
  
  record.punchOut = new Date().toISOString();
  record.punchOutLocation = { latitude, longitude };
  
  // Calculate working hours and final status
  const punchInTime = new Date(record.punchIn);
  const punchOutTime = new Date(record.punchOut);
  const workingHours = (punchOutTime - punchInTime) / (1000 * 60 * 60); // hours
  
  const punchInMinutes = punchInTime.getHours() * 60 + punchInTime.getMinutes();
  
  // Apply rules
  let finalStatus = 'present';
  let statusMessage = 'Punched out successfully';
  
  // Rule 4: Working hours check
  if (workingHours < 4) {
    finalStatus = 'absent';
    statusMessage = 'Punched out - Marked as Absent (Less than 4 hours)';
  } else if (workingHours >= 4 && workingHours < 6) {
    finalStatus = 'half_day';
    statusMessage = 'Punched out - Half Day (4-6 hours worked)';
  } else {
    // Rule 2 & 3: Check punch in time and punch out time
    if (punchInMinutes > 610) { // Late arrival after 10:10 AM
      finalStatus = 'half_day';
      statusMessage = 'Punched out - Half Day (Late arrival)';
    } else if (punchInMinutes >= 540 && punchInMinutes <= 610 && currentTime >= 1080) { // 9:00-10:10 AM punch in, 6:00 PM+ punch out
      finalStatus = 'present';
      statusMessage = 'Punched out successfully - Present';
    } else if (currentTime < 1080) { // Punch out before 6:00 PM
      finalStatus = 'half_day';
      statusMessage = 'Punched out - Half Day (Early departure)';
    }
  }
  
  record.status = finalStatus;
  record.workingHours = workingHours.toFixed(2);
  
  // Add notification
  data.notifications.push({
    id: Date.now(),
    userId: req.userId,
    message: statusMessage,
    type: 'punch_out',
    timestamp: new Date().toISOString(),
    read: false
  });
  
  writeData(data);
  res.json({ success: true, message: statusMessage, status: finalStatus, workingHours: workingHours.toFixed(2) });
});

// Get user attendance
app.get('/api/attendance/:userId', verifyToken, (req, res) => {
  const data = readData();
  const attendance = data.attendance
    .filter(a => a.userId == req.params.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(attendance);
});

// Get all attendance (admin/hr/manager)
app.get('/api/attendance', verifyToken, (req, res) => {
  if (!['admin', 'hr', 'manager'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const data = readData();
  const attendanceWithNames = data.attendance.map(a => {
    const user = data.users.find(u => u.id === a.userId);
    return { ...a, userName: user?.name || 'Unknown' };
  });
  res.json(attendanceWithNames);
});

// Get notifications
app.get('/api/notifications/:userId', verifyToken, (req, res) => {
  const data = readData();
  const notifications = data.notifications
    .filter(n => n.userId == req.params.userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(notifications);
});

// Mark notification as read
app.put('/api/notifications/:id/read', verifyToken, (req, res) => {
  const data = readData();
  const notification = data.notifications.find(n => n.id == req.params.id);
  if (notification) {
    notification.read = true;
    writeData(data);
  }
  res.json({ success: true });
});

// Get users (admin/hr)
app.get('/api/users', verifyToken, (req, res) => {
  if (!['admin', 'hr'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const data = readData();
  const users = data.users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    email: u.email
  }));
  res.json(users);
});

// Add employee (admin/hr)
app.post('/api/users', verifyToken, (req, res) => {
  if (!['admin', 'hr'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { username, password, name, email, role = 'employee' } = req.body;
  const data = readData();
  
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  data.users.push({
    id: data.nextId++,
    username,
    password: bcrypt.hashSync(password, 10),
    name,
    email,
    role
  });
  
  writeData(data);
  res.json({ success: true, message: 'User added successfully' });
});

// Analytics endpoint
app.get('/api/analytics', verifyToken, (req, res) => {
  if (!['admin', 'hr', 'manager'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const data = readData();
  const today = new Date().toISOString().split('T')[0];
  
  const analytics = {
    totalEmployees: data.users.filter(u => u.role === 'employee').length,
    presentToday: data.attendance.filter(a => a.date === today).length,
    totalAttendanceRecords: data.attendance.length,
    avgWorkingHours: calculateAvgWorkingHours(data.attendance)
  };
  
  res.json(analytics);
});

function calculateAvgWorkingHours(attendance) {
  const completedRecords = attendance.filter(a => a.punchIn && a.punchOut);
  if (completedRecords.length === 0) return 0;
  
  const totalHours = completedRecords.reduce((sum, record) => {
    const punchIn = new Date(record.punchIn);
    const punchOut = new Date(record.punchOut);
    const hours = (punchOut - punchIn) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);
  
  return (totalHours / completedRecords.length).toFixed(2);
}

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Attendance System API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      login: '/api/login',
      attendance: '/api/attendance',
      users: '/api/users'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Attendance Backend running on http://localhost:${PORT}`);
  console.log('📱 Ready for Flutter app and Web panel connections');
});