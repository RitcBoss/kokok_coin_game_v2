const mongoose = require('mongoose');
const Score = require('../models/Score');
const User = require('../models/User');
require('dotenv').config();

async function updateScoresWithCountry() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get all scores
        const scores = await Score.find();
        console.log(`Found ${scores.length} scores to update`);

        // Update each score with country information
        for (const score of scores) {
            // Find the associated user
            const user = await User.findById(score.userId);
            if (user) {
                // Update the score with country information
                score.playerData = {
                    name: user.name,
                    email: user.email,
                    country: user.country || 'Unknown'
                };
                await score.save();
                console.log(`Updated score ${score._id} with country: ${user.country || 'Unknown'}`);
            } else {
                console.log(`User not found for score ${score._id}`);
            }
        }

        console.log('Finished updating scores');
        process.exit(0);
    } catch (error) {
        console.error('Error updating scores:', error);
        process.exit(1);
    }
}

// Run the update function
updateScoresWithCountry(); 