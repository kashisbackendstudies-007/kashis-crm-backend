require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const clientRoutes = require('./routes/clientRoutes');
const siteRoutes = require('./routes/siteRoutes');
const crewRoutes = require('./routes/crewRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const instrumentRoutes = require('./routes/instrumentRoutes');
const billRoutes = require('./routes/billRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(helmet()); // Security headers
const allowedOrigins = [
  'http://localhost:5173',             // local dev
  'https://your-production-domain.com' // production frontend
  // add more if needed
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // 👈 allow cookies / credentials
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { 
    success: false, 
    error: { 
      code: 'TOO_MANY_REQUESTS', 
      message: 'Too many requests, please try again later.' 
    } 
  }
});
app.use('/v1', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'HI-LAND SURVEYORS API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/clients', clientRoutes);
app.use('/v1/sites', siteRoutes);
app.use('/v1/crews', crewRoutes);
app.use('/v1/vehicles', vehicleRoutes);
app.use('/v1/instruments', instrumentRoutes);
app.use('/v1/bills', billRoutes);
app.use('/v1/expenses', expenseRoutes);
app.use('/v1/enquiries', enquiryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;