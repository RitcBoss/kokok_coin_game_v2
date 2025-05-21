// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');
const scoreRoutes = require('./routes/scoreRoutes');
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./middleware/auth');
const scoreController = require('./controllers/scoreController');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = socketIo(server, {
    cors: {
        origin: "*", // In production, replace with your actual domain
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'] // Enable both WebSocket and polling
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

app.options('*', cors());

// Improved MongoDB connection handling
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  try {
    const db = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    
    console.log('Successfully connected to MongoDB Atlas');
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Ensure database connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);

// Public score routes - these should be before the protected routes
app.get('/api/scores/country-totals', scoreController.getCountryTotals);
app.get('/api/scores/top', scoreController.getTopScores);
app.get('/api/scores/:id', scoreRoutes);

// Protected score routes
app.use('/api/scores', authenticateToken, scoreRoutes);

// Route for displaying a shared score page
app.get('/score/:id', (req, res) => {
  console.log(`Serving score.html for shared score ID: ${req.params.id}`);
  res.sendFile(path.join(__dirname, 'public', 'score.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      message: 'Server is working!',
      mongoState: mongoose.connection.readyState,
      env: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      mongoState: mongoose.connection.readyState
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Handle any errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Add 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.url);
  res.status(404).json({ error: 'Not found' });
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = 3000; // Set fixed port to 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// For Vercel serverless deployment
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
}