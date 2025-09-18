 import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import blogRoutes from './routes/blogRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config({ quiet: true });
const app = express();

// Array of allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://sjwrites.com',
  'https://www.sjwrites.com'
];

// MANUAL CORS MIDDLEWARE - More reliable than cors package
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Handle favicon requests
app.get('/favicon.png', (req, res) => res.status(204).end());
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.json());

// Root route handler
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    api: {
      blogs: '/api/blogs',
      admin: '/api/admin'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(error.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;