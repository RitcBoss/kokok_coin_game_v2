const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
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

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/kokok_game', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Successfully connected to MongoDB.'))
.catch((error) => console.error('MongoDB connection error:', error));

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
    res.status(500).json({ error: 'Failed to fetch score' });
  }
});

// 2. Handle the specific route for displaying a shared score page SECOND
// This route should serve the score.html file
app.get('/score/:id', (req, res) => {
  console.log(`Serving score.html for shared score ID: ${req.params.id}`);
  res.sendFile(path.join(__dirname, 'public', 'score.html'));
});

// 3. Handle the specific API endpoint for saving scores THIRD
app.post('/api/scores', async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// 4. Serve static files from the public directory FOURTH
// This middleware should come after your specific routes
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // console.log(`Serving file: ${path}`); // Keep this for debugging if needed
  }
}));

// Add this before your other routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Add this at the end of your server.js file, before app.listen
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Make sure this is the absolute last route
// This catches any request that didn't match the routes/middleware above
app.get('*', (req, res) => {
  console.log(`Catch-all route serving index.html for URL: ${req.url}`);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Public directory:', path.join(__dirname, 'public'));
}); 