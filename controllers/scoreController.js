const Score = require('../models/Score');
const User = require('../models/User');

// Helper function to get country from timezone
function getCountryFromTimezone(timezone) {
    // Common timezone to country mappings
    const timezoneToCountry = {
        'Asia/Bangkok': 'Thailand',
        'Asia/Singapore': 'Singapore',
        'Asia/Kuala_Lumpur': 'Malaysia',
        'Asia/Manila': 'Philippines',
        'Asia/Jakarta': 'Indonesia',
        'Asia/Ho_Chi_Minh': 'Vietnam',
        'Asia/Seoul': 'South Korea',
        'Asia/Tokyo': 'Japan',
        'Asia/Shanghai': 'China',
        'Asia/Hong_Kong': 'Hong Kong',
        'Asia/Taipei': 'Taiwan',
        'America/New_York': 'United States',
        'America/Los_Angeles': 'United States',
        'America/Chicago': 'United States',
        'Europe/London': 'United Kingdom',
        'Europe/Paris': 'France',
        'Europe/Berlin': 'Germany',
        'Europe/Madrid': 'Spain',
        'Europe/Rome': 'Italy',
        'Australia/Sydney': 'Australia',
        'Australia/Melbourne': 'Australia',
        'Pacific/Auckland': 'New Zealand'
    };

    return timezoneToCountry[timezone] || 'Unknown';
}

// Create a new score
exports.createScore = async (req, res) => {
    try {
        console.log('Creating new score with data:', req.body);
        console.log('User data:', req.user);

        // Get score, percentage, and timezone from request body
        const { score, percentage, timezone } = req.body;
        
        // Get userId and user data from authenticated user
        const userId = req.user._id;
        const { name, email } = req.user;

        // Validate required fields
        if (score === undefined || percentage === undefined || !userId || !timezone) {
            console.error('Missing required fields:', { score, percentage, userId, timezone });
            return res.status(400).json({ 
                message: 'Score, percentage, timezone, and user ID are required.',
                received: { score, percentage, userId, timezone }
            });
        }

        // Validate score and percentage
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ message: 'Score must be a positive number' });
        }
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
            return res.status(400).json({ message: 'Percentage must be a number between 0 and 100' });
        }

        // Determine country from timezone
        const country = getCountryFromTimezone(timezone);
        console.log('Determined country:', country, 'from timezone:', timezone);

        // Always update user's country and timezone
        await User.findByIdAndUpdate(userId, { 
            country,
            timezone,
            name: name || req.user.name,
            email: email || req.user.email
        });
        console.log('Updated user data:', { country, timezone, name, email });

        // Create player data object with all required fields
        const playerData = {
            name: name || req.user.name || 'Anonymous',
            email: email || req.user.email || 'anonymous@example.com',
            country: country,
            timezone: timezone,
            score: score,
            percentage: percentage,
            timestamp: new Date()
        };

        console.log('Creating score with player data:', playerData);

        // Create new score document
        const newScore = new Score({
            score,
            percentage,
            userId,
            playerData
        });

        // Validate the score document before saving
        const validationError = newScore.validateSync();
        if (validationError) {
            console.error('Score validation error:', validationError);
            return res.status(400).json({ 
                message: 'Invalid score data', 
                errors: validationError.errors 
            });
        }

        // Save to test.scores collection
        const savedScore = await newScore.save();
        console.log('Score saved successfully to test.scores:', savedScore);

        // Populate user details
        const scoreWithUser = await savedScore.populate('userId', 'name country');
        console.log('Score with populated user:', scoreWithUser);

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            // Emit the new score
            io.emit('newScore', scoreWithUser);
            
            // Fetch and emit updated country totals
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
            io.emit('countryTotalsUpdate', countryTotals);
        }

        res.status(201).json(scoreWithUser);
    } catch (error) {
        console.error('Error creating score:', error);
        res.status(500).json({ 
            message: 'Failed to create score.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get all scores with pagination and sorting
exports.getScores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'score';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const scores = await Score.find()
            .populate('userId', 'name country') // Populate user details
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Score.countDocuments();

        res.json({
            scores,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalScores: total
        });
    } catch (error) {
        console.error('Error getting scores:', error);
        res.status(500).json({ message: 'Failed to retrieve scores.', error: error.message });
    }
};

// Get scores by country
exports.getScoresByCountry = async (req, res) => {
    try {
        const { country } = req.params;
        // Find users by country, then find scores for those users
        // This is less efficient; a better approach might be needed depending on scale
        // For now, let's assume we can filter scores by populating and matching country
        // A more performant solution would involve denormalization or aggregation
        const scores = await Score.find()
            .populate({
                path: 'userId',
                match: { country: country },
                select: 'name country'
            })
            .sort({ score: -1 })
            .limit(10);

        // Filter out scores where population failed (user not found or no country match)
        const filteredScores = scores.filter(score => score.userId !== null);

        res.json(filteredScores);
    } catch (error) {
        console.error('Error getting scores by country:', error);
        res.status(500).json({ message: 'Failed to retrieve scores by country.', error: error.message });
    }
};

// Get user's highest score
exports.getUserHighestScore = async (req, res) => {
    try {
        // Assuming the route is protected and req.user contains the user
        const userId = req.user._id;

        const score = await Score.findOne({ userId })
            .populate('userId', 'name country')
            .sort({ score: -1 });

        if (!score) {
            return res.status(404).json({ message: 'No score found for this user' });
        }

        res.json(score);
    } catch (error) {
        console.error('Error getting user highest score:', error);
        res.status(500).json({ message: 'Failed to retrieve user highest score.', error: error.message });
    }
};

// Get top scores globally
exports.getTopScores = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const scores = await Score.find()
            .populate('userId', 'name country') // Populate user details
            .sort({ score: -1 })
            .limit(limit);

        res.json(scores);
    } catch (error) {
        console.error('Error getting top scores:', error);
        res.status(500).json({ message: 'Failed to retrieve top scores.', error: error.message });
    }
};

// Get total scores by country
exports.getCountryTotals = async (req, res) => {
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

        // If no country totals found, return empty array
        if (!countryTotals || countryTotals.length === 0) {
            console.log('No country totals found after aggregation');
            return res.json([]);
        }

        res.json(countryTotals);
    } catch (error) {
        console.error('Error in getCountryTotals:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve country totals.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}; 