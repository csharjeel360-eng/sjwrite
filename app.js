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
  'http://localhost:3000',
  'https://sjwrites.com',
  'https://www.sjwrites.com',
  'https://sjwrites-clint.vercel.app',
  'https://sjwrites-client.vercel.app'
];

// AGGRESSIVE CORS MIDDLEWARE - Force headers, prevent caching
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Force cache-control headers to prevent 304 responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // CORS headers - always set them
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Accept, X-Requested-With');
  
  // Set Allow-Origin header
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('✓ CORS allowed for:', origin);
  } else if (origin) {
    // TEMPORARY: Log all requests to debug
    console.warn('CORS check - Origin:', origin, 'Allowed list:', allowedOrigins);
    // For debugging - reject but log
    console.warn('CORS would be blocked for:', origin);
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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