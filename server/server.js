import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173'], // add all dev origins you use
  credentials: true // if you use cookies/auth
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with backward compatibility
// This middleware handles old file paths and finds files in various locations
app.use('/uploads', (req, res, next) => {
  const filePath = req.path;
  const fileName = path.basename(filePath);
  const uploadsDir = path.join(__dirname, 'uploads');
  
  // If we have a filename, try to find it in various possible locations
  if (fileName && fileName.includes('.')) {
    // List of possible directories to check (old and new structure)
    const possibleDirs = ['general', 'images', 'videos', 'ressource', 'user', 'avatars', 'documents'];
    
    for (const dir of possibleDirs) {
      const fullPath = path.join(uploadsDir, dir, fileName);
      if (fs.existsSync(fullPath)) {
        // File found! Serve it directly
        return res.sendFile(fullPath);
      }
    }
    
    // If file not found in any directory, try the requested path as-is
    // This handles new uploads that are in the correct location
    const requestedPath = path.join(uploadsDir, filePath.replace(/^\/uploads/, '').replace(/^\//, ''));
    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
      return res.sendFile(requestedPath);
    }
    
    // File not found - let static middleware handle it (will return proper 404)
    // Don't return JSON for file requests
  }
  
  // For directory requests or if no filename, use default static serving
  next();
}, express.static(path.join(__dirname, 'uploads')));
// Ensure avatars directory exists
// const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
// if (!fs.existsSync(avatarsDir)) {
//   fs.mkdirSync(avatarsDir, { recursive: true });
// }

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Initialize scheduled jobs after DB connection
    initializeScheduledJobs(app);
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import bookingRoutes from './routes/bookings.js';
import mediaRoutes from './routes/media.js';
import notificationRoutes from './routes/notifications.js';
import reviewRoutes from './routes/reviews.js';
import locationRoutes from './routes/locations.js';
import weatherRoutes from './routes/weather.js';
import aiRoutes from './routes/ai.js';
import aiEnhancedRoutes from './routes/aiEnhanced.js';
import { initializeScheduledJobs } from './jobs/scheduledJobs.js';

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai', aiEnhancedRoutes); // Routes IA professionnelles

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});

export default app;

