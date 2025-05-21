const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  score: {
    type: Number,
    default: 0
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  timezone: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ score: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 