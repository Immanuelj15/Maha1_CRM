import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Custom Bulletproof CORS Middleware (Handles all cross-origin requests & OPTIONS preflight)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local uploaded files if needed
}));

// Request Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (prevent brute force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'CaterMaster CRM API',
    version: '1.0.0',
    status: 'Healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// 404 Route handler
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Exception:', err.stack || err.message);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB and Listen
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 CaterMaster Backend Server running on port ${PORT}`);
  });
};

startServer();
