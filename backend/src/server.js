const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const seedDatabase = require('./seed/seed');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const path = require('path');
const fs = require('fs');

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[FATAL] Create a .env file based on .env.example');
  process.exit(1);
}

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Rate limiting - general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } }
});
app.use('/api', apiLimiter);

// Stricter rate limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: { code: 'AUTH_RATE_LIMIT', message: 'Too many login attempts, please try again in 15 minutes' } }
});
app.use('/api/auth/login', authLimiter);

// Configure CORS
const allowedOrigins = process.env.CLIENT_URL 
  ? (process.env.CLIENT_URL.includes(',') ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : process.env.CLIENT_URL)
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// Import route modules
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const tripRoutes = require('./routes/tripRoutes');
const driverRoutes = require('./routes/driverRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const fuelRoutes = require('./routes/fuelRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const branchRoutes = require('./routes/branchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'FleetSphere Core Telematics API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build in production if available
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `API route ${req.originalUrl} not found` } });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` } });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : (err.message || 'Internal Server Error')
    }
  });
});

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
connectDB().then(async () => {
  // Check if database needs seeding
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Database] Empty database detected. Auto-seeding initial dataset...');
    await seedDatabase();
  } else {
    console.log(`[Database] Found ${userCount} existing users.`);
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 FleetSphere Server operational on http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}).catch((err) => {
  console.error('[Boot Failure] Could not connect to database:', err);
  process.exit(1);
});
