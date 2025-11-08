const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const geolib = require('geolib');

const app = express();
const JWT_SECRET = 'attendance_secret_key';

const OFFICE_LOCATION = {
  latitude: 28.460315,
  longitude: 77.0336622
};
const ALLOWED_RADIUS = 200;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

let data = {
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

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = data.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (['admin', 'hr', 'manager'].includes(user.role)) {
    const otp = generateOTP();
    data.otpStore[user.id] = { otp, expires: Date.now() + 300000 };
    
    console.log(`🔐 DEMO OTP: ${otp} for ${user.name}`);
    
    return res.json({ 
      requiresOTP: true, 
      userId: user.id,
      message: 'OTP sent to your email' 
    });
  }
  
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  });
});

app.post('/api/verify-otp', (req, res) => {
  const { userId, otp } = req.body;
  
  const storedOTP = data.otpStore[userId];
  if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }
  
  const user = data.users.find(u => u.id === userId);
  delete data.otpStore[userId];
  
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  });
});

app.post('/api/punch-in', verifyToken, (req, res) => {
  const { latitude, longitude } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const existing = data.attendance.find(a => a.userId === req.userId && a.date === today);
  if (existing) {
    return res.status(400).json({ error: 'Already punched in today' });
  }
  
  if (currentTime < 540) {
    return res.status(400).json({ error: 'Punch in allowed only after 9:00 AM' });
  }
  
  const distance = geolib.getDistance({ latitude, longitude }, OFFICE_LOCATION);
  
  if (distance > ALLOWED_RADIUS) {
    return res.status(400).json({ 
      error: `You are ${distance}m away from office. Must be within ${ALLOWED_RADIUS}m` 
    });
  }
  
  let status = 'present';
  if (currentTime > 610) {
    status = 'half_day';
  }
  
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
  
  const message = status === 'half_day' ? 'Punched in successfully (Late arrival - Half day)' : 'Punched in successfully';
  data.notifications.push({
    id: Date.now(),
    userId: req.userId,
    message,
    type: 'punch_in',
    timestamp: new Date().toISOString(),
    read: false
  });
  
  res.json({ success: true, message, distance, status });
});

app.get('/api/attendance/:userId', verifyToken, (req, res) => {
  const attendance = data.attendance
    .filter(a => a.userId == req.params.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(attendance);
});

app.get('/api/attendance', verifyToken, (req, res) => {
  if (!['admin', 'hr', 'manager'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const attendanceWithNames = data.attendance.map(a => {
    const user = data.users.find(u => u.id === a.userId);
    return { ...a, userName: user?.name || 'Unknown' };
  });
  res.json(attendanceWithNames);
});

app.get('/api/users', verifyToken, (req, res) => {
  if (!['admin', 'hr'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const users = data.users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    email: u.email
  }));
  res.json(users);
});

app.get('/api/analytics', verifyToken, (req, res) => {
  if (!['admin', 'hr', 'manager'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  const analytics = {
    totalEmployees: data.users.filter(u => u.role === 'employee').length,
    presentToday: data.attendance.filter(a => a.date === today).length,
    totalAttendanceRecords: data.attendance.length,
    avgWorkingHours: 0
  };
  
  res.json(analytics);
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Flutter Attendance System API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = (req, res) => {
  return app(req, res);
};