const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    score: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playerData: {
        name: {
            type: String,
            required: true,
            default: 'Anonymous'
        },
        email: {
            type: String,
            required: true,
            default: 'anonymous@example.com'
        },
        country: {
            type: String,
            required: true,
            default: 'Unknown'
        },
        timezone: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        percentage: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true,
    collection: 'test.scores' // Explicitly set the collection name
});

// Create indexes for better query performance
scoreSchema.index({ score: -1 }); // Index for sorting by score
scoreSchema.index({ createdAt: -1 }); // Index for sorting by date
scoreSchema.index({ userId: 1 });
scoreSchema.index({ 'playerData.country': 1 }); // Index for country-based queries
scoreSchema.index({ 'playerData.timezone': 1 }); // Index for timezone-based queries

// Pre-save middleware to ensure playerData is consistent
scoreSchema.pre('save', function(next) {
    // Ensure playerData.score matches the main score
    this.playerData.score = this.score;
    // Ensure playerData.percentage matches the main percentage
    this.playerData.percentage = this.percentage;
    next();
});

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score; 