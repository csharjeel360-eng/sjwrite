 import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import blogRoutes from './routes/blogRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';

dotenv.config({ quiet: true });
const app = express();

// Array of allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://sjwrites.com',
  'https://www.sjwrites.com'
];

// SIMPLIFIED CORS configuration - This works better on Vercel
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));

// Handle preflight requests for ALL routes
app.options('*', cors());

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
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS error',
      message: 'Origin not allowed'
    });
  }
  
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