// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

app.options('*', cors());

// Improved MongoDB connection handling for serverless environments
let cachedDb = null;

const connectToDatabase = async () => {
  // If we have a cached connection, use it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  // We don't have a cached connection, create a new one
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  console.log('Creating new database connection');
  
  try {
    const db = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // These timeouts are important for serverless environments
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // This option helps with connection management in serverless
      bufferCommands: false,
    });
    
    console.log('Successfully connected to MongoDB');
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Propagate the error up
  }
};

// Score Schema
const scoreSchema = new mongoose.Schema({
  score: Number,
  percentage: Number,
  createdAt: { type: Date, default: Date.now }
});

const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

// API endpoint for fetching a single score
app.get('/api/scores/:id', async (req, res) => {
  try {
    await connectToDatabase();
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

// Route for displaying a shared score page
app.get('/score/:id', (req, res) => {
  console.log(`Serving score.html for shared score ID: ${req.params.id}`);
  res.sendFile(path.join(__dirname, 'public', 'score.html'));
});

// API endpoint for saving scores
app.post('/api/scores', async (req, res) => {
  try {
    await connectToDatabase();
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Something broke!',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Catch-all route
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