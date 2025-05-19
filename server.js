const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow requests from any origin
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// Add this near the top of your server.js
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Add this before your routes
app.options('*', cors()); // Enable pre-flight requests for all routes

// MongoDB connection handling
let isConnecting = false;
let connectionPromise = null;

const connectDB = async () => {
  // If we're already connected, return the existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If we're in the process of connecting, return the existing promise
  if (isConnecting) {
    return connectionPromise;
  }

  // Start a new connection attempt
  isConnecting = true;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kokok_game';
  console.log('Attempting to connect to MongoDB...');

  connectionPromise = mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).then(() => {
    console.log('Successfully connected to MongoDB.');
    isConnecting = false;
    return mongoose.connection;
  }).catch((error) => {
    console.error('MongoDB connection error:', error);
    isConnecting = false;
    throw error;
  });

  return connectionPromise;
};

// Score Schema
const scoreSchema = new mongoose.Schema({
  score: Number,
  percentage: Number,
  createdAt: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// 1. Handle the specific API endpoint for fetching a single score FIRST
app.get('/api/scores/:id', async (req, res) => {
  try {
    await connectDB();
    console.log('Fetching score for ID:', req.params.id);
    const score = await Score.findById(req.params.id);
    if (!score) {
      console.log('Score not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Score not found' });
    }
    console.log('Score found:', score);
    res.json(score);
  } catch (error) {
    console.error('Error fetching score:', error);
    res.status(500).json({ error: 'Failed to fetch score', details: error.message });
  }
});

// 2. Handle the specific route for displaying a shared score page SECOND
app.get('/score/:id', (req, res) => {
  console.log(`Serving score.html for shared score ID: ${req.params.id}`);
  res.sendFile(path.join(__dirname, 'public', 'score.html'));
});

// 3. Handle the specific API endpoint for saving scores THIRD
app.post('/api/scores', async (req, res) => {
  try {
    await connectDB();
    console.log('Received score data:', req.body);
    const { score, percentage } = req.body;

    if (!score || !percentage) {
      return res.status(400).json({ error: 'Score and percentage are required' });
    }

    const newScore = new Score({ score, percentage });
    await newScore.save();
    console.log('Score saved successfully:', newScore);
    res.json({ id: newScore._id });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ 
      error: 'Failed to save score', 
      details: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

// 4. Serve static files from the public directory FOURTH
app.use(express.static(path.join(__dirname, 'public')));

// Add this before your other routes
app.get('/test', async (req, res) => {
  try {
    await connectDB();
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

// Add this at the end of your server.js file, before app.listen
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Something broke!',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Make sure this is the absolute last route
app.get('*', (req, res) => {
  console.log(`Catch-all route serving index.html for URL: ${req.url}`);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For Vercel serverless deployment
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  // For local development
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Public directory:', path.join(__dirname, 'public'));
  });
}