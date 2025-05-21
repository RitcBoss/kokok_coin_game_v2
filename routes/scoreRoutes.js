const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { authenticateToken } = require('../middleware/auth');
const Score = require('../models/Score');

// Public routes
router.get('/country-totals', async (req, res) => {
    try {
        console.log('Fetching country totals...');
        
        // First check if we have any scores
        const totalScores = await Score.countDocuments();
        console.log('Total scores in database:', totalScores);
        
        if (totalScores === 0) {
            console.log('No scores found in database');
            return res.json([]);
        }

        const countryTotals = await Score.aggregate([
            {
                $match: {
                    'playerData.country': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$playerData.country',
                    totalScore: { $sum: '$score' }
                }
            },
            {
                $project: {
                    _id: 0,
                    country: '$_id',
                    totalScore: 1
                }
            },
            {
                $sort: { totalScore: -1 }
            }
        ]);

        console.log('Country totals calculated:', countryTotals);
        res.json(countryTotals);
    } catch (error) {
        console.error('Error in getCountryTotals:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve country totals.', 
            error: error.message 
        });
    }
});

// Get a single score by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const scoreId = req.params.id;
        console.log('Fetching score for ID:', scoreId);

        // Validate score ID format
        if (!scoreId || !/^[0-9a-fA-F]{24}$/.test(scoreId)) {
            console.log('Invalid score ID format:', scoreId);
            return res.status(400).json({ error: 'Invalid score ID format' });
        }

        const score = await Score.findById(scoreId)
            .populate('userId', 'name country');
        
        if (!score) {
            console.log('Score not found for ID:', scoreId);
            return res.status(404).json({ error: 'Score not found' });
        }
        
        console.log('Score found:', score);
        res.json(score);
    } catch (error) {
        console.error('Error fetching score:', error);
        res.status(500).json({ 
            error: 'Failed to fetch score', 
            details: error.message 
        });
    }
});

// Get top scores (public)
router.get('/top', async (req, res) => {
    try {
        const scores = await Score.find()
            .populate('userId', 'name country')
            .sort({ score: -1 })
            .limit(10);
        res.json(scores);
    } catch (error) {
        console.error('Error getting top scores:', error);
        res.status(500).json({ error: 'Failed to get top scores' });
    }
});

// Protected routes
router.post('/', authenticateToken, scoreController.createScore);
router.get('/user/:email', authenticateToken, scoreController.getUserHighestScore);

module.exports = router; 